class Request {
  constructor() {
    this.canceledRequests = {};
    this.requestsSeen = {};
  }

  async initialize(background) {
    this.background = background;
    this.storage = background.storage;
    this.container = background.container;
    this.mouseclick = background.mouseclick;
    this.mac = background.mac;

    this.webRequestOnBeforeRequest.bind(this);
    browser.webRequest.onBeforeSendHeaders.addListener(async details => {
      return this.maybeSetAndAddCookiesToHeader(details);
    }, {
      urls: ['<all_urls>'],
      types: ['main_frame']
    }, [
      'blocking', 'requestHeaders'
    ]);

    // Clean up canceled requests
    browser.webRequest.onCompleted.addListener((request) => {
      if (this.canceledRequests[request.tabId]) {
        delete this.canceledRequests[request.tabId];
      }
    }, {
      urls: ['<all_urls>'],
      types: ['main_frame']
    });
    browser.webRequest.onErrorOccurred.addListener((request) => {
      if (this.canceledRequests[request.tabId]) {
        delete this.canceledRequests[request.tabId];
      }
    }, {
      urls: ['<all_urls>'],
      types: ['main_frame']
    });
  }


  async webRequestOnBeforeRequest(request) {
    const returnVal = await this._webRequestOnBeforeRequest(request);

    if (!this.requestsSeen[request.requestId]) {
      this.requestsSeen[request.requestId] = true;
      delay(5000).then(() => {
        delete this.requestsSeen[request.requestId];
      });
    }

    if (returnVal && returnVal.cancel) {
      this.cancelRequest(request);
      return returnVal;
    } else if (!returnVal || (returnVal && !returnVal.clean)) {
      this.container.markUnclean(request.tabId);
    }

    // make sure we shouldnt cancel anyway
    if (this.shouldCancelRequest(request)) {
      debug('[webRequestOnBeforeRequest] canceling', request);
      this.cancelRequest(request);
      return {cancel: true};
    }
    return;
  }


  async _webRequestOnBeforeRequest(request) {
    debug('[browser.webRequest.onBeforeRequest] incoming request', request);
    if (request.tabId === -1) {
      debug('[browser.webRequest.onBeforeRequest] onBeforeRequest request doesnt belong to a tab, why are you main_frame?', request);
      return;
    }

    this.container.removeBrowserActionBadge(request.tabId);

    if (this.shouldCancelRequest(request)) {
      debug('[webRequestOnBeforeRequest] canceling', request);
      return { cancel: true };
    }

    let macAssignment;
    try {
      macAssignment = await this.mac.getAssignment(request.url);
    } catch (error) {
      debug('[webRequestOnBeforeRequest] contacting mac failed, either not installed or old version', error);
    }

    let tab;
    if (macAssignment) {
      if (macAssignment.neverAsk) {
        debug('[webRequestOnBeforeRequest] mac neverask assigned, we do nothing', macAssignment);
        return;
      } else {
        debug('[webRequestOnBeforeRequest] mac assigned', macAssignment);
      }
    }
    try {
      tab = await browser.tabs.get(request.tabId);
      debug('[webRequestOnBeforeRequest] onbeforeRequest requested tab information', tab);
    } catch (error) {
      debug('[webRequestOnBeforeRequest] onbeforeRequest retrieving tab information failed, mac was probably faster', error);
    }

    if (tab && tab.incognito) {
      debug('[webRequestOnBeforeRequest] tab is incognito, ignore it', tab);
      return;
    }

    this.container.maybeAddHistory(tab, request.url);

    if ((request.url.startsWith('http://addons.mozilla.org') || request.url.startsWith('https://addons.mozilla.org')) &&
        this.storage.local.preferences.ignoreRequestsToAMO) {
      debug('[webRequestOnBeforeRequest] we are ignoring requests to addons.mozilla.org because we arent allowed to cancel requests anyway', request);
      return;
    }

    if (request.url.startsWith('https://getpocket.com') &&
        this.storage.local.preferences.ignoreRequestsToPocket) {
      // TODO consider "Exclude Websites" in the preferences
      debug('[webRequestOnBeforeRequest] we are ignoring requests to getpocket.com because of #52', request);
      return;
    }

    const isolated = !macAssignment && await this.maybeIsolate(tab, request);
    if (isolated) {
      debug('[webRequestOnBeforeRequest] we decided to isolate and open new tmpcontainer', request);
      return isolated;
    }

    const alwaysOpenIn = !macAssignment && await this.maybeAlwaysOpenInTemporaryContainer(tab, request);
    if (alwaysOpenIn) {
      debug('[webRequestOnBeforeRequest] we decided to always open in new tmpcontainer', request);
      return alwaysOpenIn;
    } else if (!this.storage.local.preferences.automaticMode &&
               !this.mouseclick.linksClicked[request.url]) {
      debug('[webRequestOnBeforeRequest] automatic mode disabled and no link clicked', request);
      return;
    } else if (this.mouseclick.unhandledLinksClicked[request.url]) {
      debug('[webRequestOnBeforeRequest] we saw an unhandled click for that url', request);
      return;
    }

    if (this.background.noContainerTabs[request.tabId]) {
      debug('[webRequestOnBeforeRequest] no container tab, we ignore that', tab);
      return;
    }

    if (this.mouseclick.linksClicked[request.url]) {
      return this.handleClickedLink(request, tab, macAssignment);
    } else {
      return this.handleNotClickedLink(request, tab, macAssignment);
    }
  }


  async handleClickedLink(request, tab, macAssignment) {
    debug('[handleClickedLink] onBeforeRequest', request, tab);

    if (tab && tab.cookieStoreId !== 'firefox-default' &&
        this.container.urlCreatedContainer[request.url] === tab.cookieStoreId) {
      debug('[handleClickedLink] link click already created this container, we can stop here', request, tab);
      return;
    }

    if (this.cancelRequest(request)) {
      debug('[handleClickedLink] canceling request', request, tab);
      return { cancel: true };
    }

    let deletesHistoryContainer = false;
    if (tab &&
        this.storage.local.tempContainers[tab.cookieStoreId] &&
        this.storage.local.tempContainers[tab.cookieStoreId].deletesHistory &&
        this.storage.local.preferences.deletesHistoryContainerMouseClicks === 'automatic') {
      deletesHistoryContainer = true;
    }

    if (macAssignment && (!tab || (tab && tab.cookieStoreId !== macAssignment.cookieStoreId))) {
      debug('[handleClickedLink] decided to reopen but mac assigned, maybe reopen confirmpage', request, tab, macAssignment);
      this.mac.maybeReopenConfirmPage(macAssignment, request, tab, deletesHistoryContainer);
      return;
    }

    let newTab;
    if (this.mouseclick.linksClicked[request.url] &&
        this.mouseclick.linksClicked[request.url].clickType === 'left' &&
        !this.storage.local.preferences.replaceTabs) {
      debug('[handleClickedLink] creating new container because request got left clicked', this.mouseclick.linksClicked[request.url], tab);
      newTab = await this.container.createTabInTempContainer({tab, active: true, url: request.url, deletesHistory: deletesHistoryContainer, request});
      if (tab && this.mouseclick.linksClicked[request.url].tab.id !== tab.id) {
        debug('[handleClickedLink] looks like the left clicked opened a new tab, remove it', tab);
        await this.container.removeTab(tab);
      }
    } else {
      newTab = await this.container.reloadTabInTempContainer({
        tab,
        url: request.url,
        deletesHistory: deletesHistoryContainer,
        request
      });
    }
    debug('[handleClickedLink] created new tab', newTab);
    debug('[handleClickedLink] canceling request', request);
    return { cancel: true };
  }


  async handleNotClickedLink(request, tab, macAssignment) {
    debug('[handleNotClickedLink] onBeforeRequest', request, tab);

    if (tab && tab.cookieStoreId === 'firefox-default' && tab.openerTabId) {
      debug('[webRequestOnBeforeRequest] default container and openerTabId set', tab);
      const openerTab = await browser.tabs.get(tab.openerTabId);
      if (!openerTab.url.startsWith('about:') && !openerTab.url.startsWith('moz-extension:')) {
        debug('[webRequestOnBeforeRequest] request didnt came from about/moz-extension page, we do nothing', openerTab);
        return;
      }
    }
    if (!this.storage.local.preferences.automaticMode) {
      debug('[browser.webRequest.onBeforeRequest] got not clicked request but automatic mode is off, ignoring', request);
      return;
    }


    if (!macAssignment) {
      let containerExists = false;
      if (tab && tab.cookieStoreId === 'firefox-default') {
        containerExists = true;
      } else {
        try {
          containerExists = await browser.contextualIdentities.get(tab.cookieStoreId);
        } catch (error) {
          debug('[handleNotClickedLink] container doesnt exist anymore', tab);
        }
      }
      if (tab && tab.cookieStoreId !== 'firefox-default' && containerExists) {
        debug('[handleNotClickedLink] onBeforeRequest tab belongs to a non-default container', tab, request);
        return;
      }
    } else if (tab && tab.url && request && request.url) {
      const parsedTabUrl = new URL(tab.url);
      const parsedRequestUrl = new URL(request.url);
      if (tab.cookieStoreId === macAssignment.cookieStoreId &&
          parsedTabUrl.hostname === parsedRequestUrl.hostname &&
          tab.id === request.tabId) {
        debug('[webRequestOnBeforeRequest] the request url is mac assigned to this container, we do nothing');
        return;
      }
    }

    let deletesHistoryContainer = false;
    if (this.storage.local.preferences.deletesHistoryContainer === 'automatic') {
      deletesHistoryContainer = true;
    }

    if (macAssignment) {
      if (tab && tab.cookieStoreId && this.storage.local.tempContainers[tab.cookieStoreId]) {
        debug('[handleNotClickedLink] mac assigned but we are already in a tmp container, we do nothing', request, tab, macAssignment);
        return;
      }
      debug('[handleNotClickedLink] decided to reopen but mac assigned, maybe reopen confirmpage', request, tab, macAssignment);
      // we dont know here whether to cancel or not, just let it fall through
      return this.mac.maybeReopenConfirmPage(macAssignment, request, tab, deletesHistoryContainer);
    }

    if (this.cancelRequest(request)) {
      return { cancel: true };
    }

    debug('[handleNotClickedLink] onBeforeRequest reload in temp tab', tab, request);
    await this.container.reloadTabInTempContainer({
      tab,
      url: request.url,
      active: true,
      deletesHistory: deletesHistoryContainer,
      request,
      dontPin: false
    });

    return { cancel: true };
  }


  cancelRequest(request) {
    if (!request ||
      typeof request.requestId === 'undefined' ||
      typeof request.tabId === 'undefined') {
      debug('[cancelRequest] invalid request', request);
      return;
    }

    if (!this.canceledRequests[request.tabId]) {
      debug('[cancelRequest] marked request as canceled', request);
      this.canceledRequests[request.tabId] = {
        requestIds: {
          [request.requestId]: true
        },
        urls: {
          [request.url]: true
        }
      };
      // cleanup canceledRequests later
      setTimeout(() => {
        debug('[webRequestOnBeforeRequest] cleaning up canceledRequests', request);
        delete this.canceledRequests[request.tabId];
      }, 2000);
      return false;
    } else {
      debug('[cancelRequest] already canceled', request, this.canceledRequests);
      let cancel = false;
      if (this.shouldCancelRequest(request)) {
        // same requestId or url from the same tab, this is a redirect that we have to cancel to prevent opening two tabs
        cancel = true;
      }
      // we decided to cancel the request at this point, register canceled request
      this.canceledRequests[request.tabId].requestIds[request.requestId] = true;
      this.canceledRequests[request.tabId].urls[request.url] = true;
      return cancel;
    }
  }


  shouldCancelRequest(request) {
    if (!request ||
      typeof request.requestId === 'undefined' ||
      typeof request.tabId === 'undefined') {
      debug('[shouldCancelRequest] invalid request', request);
      return;
    }

    if (this.canceledRequests[request.tabId] &&
        (this.canceledRequests[request.tabId].requestIds[request.requestId] ||
         this.canceledRequests[request.tabId].urls[request.url])) {
      return true;
    }
    return false;
  }


  async maybeIsolate(tab, request) {
    if (!tab || !tab.url) {
      debug('[maybeIsolate] we cant proceed without tab url information', tab, request);
      return false;
    }

    if (!await this.shouldIsolate(tab, request)) {
      debug('[maybeIsolate] decided to not isolate', tab, request);
      return false;
    }

    debug('[maybeIsolate] isolating', tab, request);
    if (this.cancelRequest(request)) {
      debug('[maybeIsolate] canceling request');
      return { cancel: true };
    }

    const params = {
      tab,
      active: tab.active,
      url: request.url,
      request,
      deletesHistory: this.storage.local.preferences.deletesHistoryContainerIsolation === 'automatic'
    };
    if (tab.url === 'about:newtab' || tab.url === 'about:blank' ||
        this.storage.local.preferences.replaceTabs) {
      await this.container.reloadTabInTempContainer(params);
    } else {
      await this.container.createTabInTempContainer(params);
    }
    return {cancel: true};
  }


  async shouldIsolate(tab, request, openerCheck = false) {
    debug('[shouldIsolate]', tab, request);
    if (this.storage.local.tempContainers[tab.cookieStoreId] &&
        this.storage.local.tempContainers[tab.cookieStoreId].clean) {
      debug('[shouldIsolate] not isolating because the tmp container is still clean');
      return false;
    }

    if (this.shouldIsolateMac(tab)) {
      debug('[shouldIsolate] mac isolation');
      return true;
    }

    if (!openerCheck && tab.url === 'about:blank' && tab.openerTabId) {
      const openerTab = await browser.tabs.get(tab.openerTabId);
      debug('[shouldIsolate] we have to check the opener against the request', openerTab);

      if (this.container.isPermanentContainer(tab.cookieStoreId) &&
          openerTab.cookieStoreId !== tab.cookieStoreId) {
        debug('[shouldIsolate] the tab loads a permanent container that is different from the openerTab, probaby explicitly selected in the context menu');
        return false;
      }

      if (await this.shouldIsolate(openerTab, request, true)) {
        debug('[shouldIsolate] decided to isolate because of opener', openerTab);
        return true;
      }

      debug('[shouldIsolate] decided to not isolate because of opener', openerTab);
      return false;
    }

    if ((tab.url === 'about:blank' || tab.url === 'about:home') && !tab.openerTabId) {
      debug('[shouldIsolate] not isolating because the tab url is blank/home and no openerTabId');
      return false;
    }

    if (tab.url === 'about:blank' && this.requestsSeen[request.requestId]) {
      debug('[shouldIsolate] not isolating because the tab url is blank and we seen this request before, probably redirect');
      return false;
    }

    const parsedTabURL = new URL(tab.url);
    const parsedRequestURL = new URL(request.url);

    for (let domainPattern in this.storage.local.preferences.isolationDomain) {
      if ((parsedTabURL.hostname === domainPattern ||
          parsedTabURL.hostname.match(globToRegexp(domainPattern)))) {
        const preferences = this.storage.local.preferences.isolationDomain[domainPattern];
        debug('[shouldIsolate] found pattern', domainPattern, preferences);

        if (await this.checkIsolationPreferenceAgainstUrl(
          preferences.action, parsedTabURL.hostname, parsedRequestURL.hostname, tab
        )) {
          return true;
        }
      }
    }

    if (await this.checkIsolationPreferenceAgainstUrl(
      this.storage.local.preferences.isolationGlobal, parsedTabURL.hostname, parsedRequestURL.hostname, tab
    )) {
      return true;
    }

    debug('[shouldIsolate] not isolating');
    return false;
  }

  shouldIsolateMac(tab) {
    if (this.storage.local.preferences.isolationMac === 'disabled') {
      debug('[shouldIsolateMac] mac isolation disabled');
      return false;
    }
    if (this.container.isPermanentContainer(tab.cookieStoreId)) {
      debug('[shouldIsolateMac] mac isolating because request url is not assigned to the tabs permanent container');
      return true;
    }
    return false;
  }

  async checkIsolationPreferenceAgainstUrl(preference, origin, target, tab) {
    debug('[checkIsolationPreferenceAgainstUrl]', preference, origin, target, tab);
    switch (preference) {
    case 'always':
      debug('[checkIsolationPreferenceAgainstUrl] isolating based on global "always"');
      return true;

    case 'notsamedomainexact':
      if (target !== origin) {
        debug('[checkIsolationPreferenceAgainstUrl] isolating based on global "notsamedomainexact"');
        return true;
      }
      break;

    case 'notsamedomain':
      if (!this.background.sameDomain(origin, target) &&
          (!tab.openerTabId || !await this.background.sameDomainTabUrl(tab.openerTabId, target))) {
        debug('[checkIsolationPreferenceAgainstUrl] isolating based on global "notsamedomain"');
        return true;
      }
      break;
    }
    return false;
  }


  async maybeAlwaysOpenInTemporaryContainer(tab, request) {
    if (!Object.keys(this.storage.local.preferences.alwaysOpenInDomain).length) {
      return;
    }
    if (!tab || !tab.url) {
      debug('[maybeAlwaysOpenInTemporaryContainer] we cant proceed without tab url information', tab, request);
      return false;
    }
    const parsedTabURL = new URL(tab.url);
    const parsedRequestURL = new URL(request.url);
    let reopen = false;
    debug('[maybeAlwaysOpenInTemporaryContainer]',
      tab, request, parsedTabURL.hostname, parsedRequestURL.hostname);

    for (let domainPattern in this.storage.local.preferences.alwaysOpenInDomain) {
      if ((parsedRequestURL.hostname === domainPattern ||
          parsedRequestURL.hostname.match(globToRegexp(domainPattern)))) {

        const preferences = this.storage.local.preferences.alwaysOpenInDomain[domainPattern];
        debug('[maybeAlwaysOpenInTemporaryContainer] found pattern', domainPattern, preferences);
        if (this.storage.local.tempContainers[tab.cookieStoreId] &&
            this.storage.local.tempContainers[tab.cookieStoreId].clean) {
          debug('[maybeAlwaysOpenInTemporaryContainer] not reopening because the tmp container is still clean');
          break;
        }

        if (tab.cookieStoreId !== 'firefox-default' &&
            !this.storage.local.tempContainers[tab.cookieStoreId] &&
            (typeof preferences !== 'object' ||
             preferences.allowedInPermanent)) {
          debug('[maybeAlwaysOpenInTemporaryContainer] not reopening because not in tmp or default container and allowed to load in permanent container');
          break;
        }

        if (!this.storage.local.tempContainers[tab.cookieStoreId]) {
          debug('[maybeAlwaysOpenInTemporaryContainer] reopening because not in a tmp container');
          reopen = true;
          break;
        }

        if (tab.url === 'about:blank' && this.requestsSeen[request.requestId]) {
          debug('[maybeAlwaysOpenInTemporaryContainer] not reopening because the tab url is blank and we seen this request before, probably redirect');
          break;
        }

        if (parsedTabURL.hostname !== domainPattern &&
            !parsedTabURL.hostname.match(globToRegexp(domainPattern))) {
          let openerMatches = false;
          if (tab.openerTabId) {
            const openerTab = await browser.tabs.get(tab.openerTabId);
            if (!openerTab.url.startsWith('about:')) {
              const openerTabParsedURL = new URL(openerTab.url);
              if (openerTabParsedURL.hostname === domainPattern ||
                  openerTabParsedURL.hostname.match(globToRegexp(domainPattern))) {
                openerMatches = true;
              }
            }
          }
          if (!openerMatches) {
            debug('[maybeAlwaysOpenInTemporaryContainer] reopening because the tab url doesnt match the pattern', parsedTabURL.hostname, domainPattern);
            reopen = true;
            break;
          }
        }
      }
    }

    if (reopen) {
      if (this.cancelRequest(request)) {
        debug('[maybeAlwaysOpenInTemporaryContainer] canceling request');
        return { cancel: true };
      }

      const deletesHistory = this.storage.local.preferences.deletesHistoryContainerAlwaysPerWebsite === 'automatic';
      const params = {
        tab,
        active: true,
        url: request.url,
        request,
        deletesHistory
      };
      if (tab.url === 'about:newtab' || tab.url === 'about:blank') {
        await this.container.reloadTabInTempContainer(params);
      } else {
        await this.container.createTabInTempContainer(params);
      }
      return {cancel: true};
    }

    debug('[maybeAlwaysOpenInTemporaryContainer] nothing matched, we do nothing', request);
    return false;
  }

  async maybeSetAndAddCookiesToHeader(details) {
    if (details.tabId < 0 || !Object.keys(this.storage.local.preferences.setCookiesDomain).length) {
      return;
    }

    let tab;
    try {
      const parsedRequestURL = new URL(details.url);
      let cookieHeader;
      let cookiesHeader = {};
      let cookieHeaderChanged = false;
      for (let domainPattern in this.storage.local.preferences.setCookiesDomain) {
        if (parsedRequestURL.hostname !== domainPattern &&
            !parsedRequestURL.hostname.match(globToRegexp(domainPattern))) {
          continue;
        }
        if (!tab) {
          tab = await browser.tabs.get(details.tabId);
          if (!this.storage.local.tempContainers[tab.cookieStoreId]) {
            debug('[maybeSetAndAddCookiesToHeader] not a temporary container', tab);
            return;
          }

          cookieHeader = details.requestHeaders.find(element => element.name.toLowerCase() === 'cookie');
          if (cookieHeader) {
            cookiesHeader = cookieHeader.value.split('; ').reduce((accumulator, cookie) => {
              const split = cookie.split('=');
              if (split.length === 2) {
                accumulator[split[0]] = split[1];
              }
              return accumulator;
            }, {});
          }
          debug('[maybeAddCookiesToHeader] found temp tab and header', details, cookieHeader, cookiesHeader);
        }

        for (let cookie of this.storage.local.preferences.setCookiesDomain[domainPattern]) {
          if (!cookie) {
            continue;
          }
          // website pattern matched request, set cookie
          const setCookie = {
            domain: cookie.domain || undefined,
            expirationDate: cookie.expirationDate ? parseInt(cookie.expirationDate) : undefined,
            httpOnly: cookie.httpOnly === '' ? undefined : (cookie.httpOnly === 'true' ? true : false),
            name: cookie.name,
            path: cookie.path || undefined,
            secure: cookie.secure === '' ? undefined : (cookie.secure === 'true' ? true : false),
            url: cookie.url,
            value: cookie.value || undefined,
            storeId: tab.cookieStoreId
          };
          debug('[maybeSetCookies] setting cookie', cookie, setCookie);
          const cookieSet = await browser.cookies.set(setCookie);
          debug('[maybeSetCookies] cookie set', cookieSet);

          if (cookiesHeader[cookie.name] === cookie.value) {
            debug('[maybeSetCookies] the set cookie is already in the header', cookie, cookiesHeader);
            continue;
          }

          // check if we're allowed to send the cookie with the current request
          const cookieAllowed = await browser.cookies.get({
            name: cookie.name,
            url: details.url,
            storeId: tab.cookieStoreId
          });
          debug('[maybeAddCookiesToHeader] checked if allowed to add cookie to header', cookieAllowed);

          if (cookieAllowed) {
            cookieHeaderChanged = true;
            cookiesHeader[cookieAllowed.name] = cookieAllowed.value;
            debug('[maybeAddCookiesToHeader] cookie value changed', cookiesHeader);
          }
        }
      }
      debug('[maybeAddCookiesToHeader] cookieHeaderChanged', cookieHeaderChanged, cookieHeader, cookiesHeader);
      if (!cookieHeaderChanged) {
        return;
      } else {
        const changedCookieHeaderValues = [];
        Object.keys(cookiesHeader).map(cookieName => {
          changedCookieHeaderValues.push(`${cookieName}=${cookiesHeader[cookieName]}`);
        });
        const changedCookieHeaderValue = changedCookieHeaderValues.join('; ');
        debug('[maybeAddCookiesToHeader] changedCookieHeaderValue', changedCookieHeaderValue);
        if (cookieHeader) {
          cookieHeader.value = changedCookieHeaderValue;
        } else {
          details.requestHeaders.push({
            name: 'Cookie',
            value: changedCookieHeaderValue
          });
        }
        debug('[maybeAddCookiesToHeader] changed cookieHeader to', cookieHeader, details);
        return details;
      }
    } catch (error) {
      debug('[maybeAddCookiesToHeader] something went wrong while adding cookies to header', tab, details.url, error);
      return;
    }
  }
}

window.Request = Request;
