const { globToRegexp } = require('./utils');
const { debug } = require('./log');

class Request {
  constructor() {
    this.canceledRequests = {};
  }

  async initialize(background) {
    this.background = background;
    this.storage = background.storage;
    this.container = background.container;
    this.mouseclick = background.mouseclick;
    this.mac = background.mac;

    browser.webRequest.onBeforeRequest.addListener(this.webRequestOnBeforeRequest.bind(this),  {
      urls: ['<all_urls>'],
      types: ['main_frame']
    }, [
      'blocking'
    ]);

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
    debug('[browser.webRequest.onBeforeRequest] incoming request', request);
    if (request.tabId === -1) {
      debug('[browser.webRequest.onBeforeRequest] onBeforeRequest request doesnt belong to a tab, why are you main_frame?', request);
      return;
    }

    this.container.removeBrowserActionBadge(request.tabId);

    let macAssignment;
    try {
      macAssignment = await this.mac.getAssignment(request.url);
      if (this.background.macLegacy) {
        this.background.macLegacy.removeAllListeners();
        this.background.macLegacy = false;
      }
    } catch (error) {
      debug('[webRequestOnBeforeRequest] contacting mac failed, either not installed or old version', error);
      if (!this.background.macLegacy) {
        debug('[webRequestOnBeforeRequest] loading macLegacy as fallback');
        this.background.loadMacLegacy();
      }
    }

    if (this.shouldCancelRequest(request)) {
      debug('[webRequestOnBeforeRequest] canceling', request);
      return { cancel: true };
    }

    if (request.url.startsWith('https://getpocket.com')) {
      // TODO consider "Decontain Websites" in the preferences
      // getpocket.com is ignored because of #52
      debug('[webRequestOnBeforeRequest] we are ignoring requests to getpocket.com because of #52', request);
      return;
    }

    let tab = {
      id: request.tabId,
      cookieStoreId: 'firefox-default'
    };
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
      debug('[webRequestOnBeforeRequest] onbeforeRequest retrieving tab information failed', error);

      const hook = await this.background.emit('webRequestOnBeforeRequestFailed', request);
      if (typeof hook[0] !== 'undefined' && hook[0]) {
        tab = hook[0];
      }
    }

    this.container.maybeAddHistory(tab, request.url);

    let alwaysOpenIn = false;
    if (this.shouldAlwaysOpenInTemporaryContainer(request)) {
      debug('[webRequestOnBeforeRequest] always open in tmpcontainer request', request);
      alwaysOpenIn = true;
    } else if (!this.storage.local.preferences.automaticMode &&
               !this.mouseclick.linksClicked[request.url]) {
      debug('[webRequestOnBeforeRequest] automatic mode disabled and no link clicked', request);
      return;
    }

    if (alwaysOpenIn && !this.mouseclick.linksClicked[request.url] && tab.openerTabId) {
      // TODO probably macLegacy-related
      debug('[webRequestOnBeforeRequest] always open in tmpcontainer request, simulating click', request);
      this.linkClicked(request.url, {
        id: tab.openerTabId,
        cookieStoreId: tab.cookieStoreId
      });
    }

    if (tab.incognito) {
      debug('[webRequestOnBeforeRequest] tab is incognito, ignore it', tab);
      return;
    }

    if (!alwaysOpenIn && this.background.noContainerTabs[tab.id]) {
      debug('[webRequestOnBeforeRequest] no container tab, we ignore that', tab);
      return;
    }

    const hook = await this.background.emit('webRequestOnBeforeRequest', {request, tab});
    if (typeof hook[0] !== 'undefined' && !hook[0]) {
      return;
    }

    let returnVal;
    if (this.mouseclick.linksClicked[request.url]) {
      returnVal = await this.handleClickedLink(request, tab, macAssignment);
    } else {
      returnVal = await this.handleNotClickedLink(request, tab, alwaysOpenIn, macAssignment);
    }

    if (returnVal && returnVal.cancel) {
      this.cancelRequest(request);
    } else {
      if (this.storage.local.tempContainers[tab.cookieStoreId] &&
          this.storage.local.tempContainers[tab.cookieStoreId].clean) {
        debug('[webRequestOnBeforeRequest] marking tmp container as not clean anymore', tab);
        this.storage.local.tempContainers[tab.cookieStoreId].clean = false;
      }
    }
    return returnVal;
  }


  async handleClickedLink(request, tab, macAssignment) {
    debug('[handleClickedLink] onBeforeRequest', request, tab);

    const hook = await this.background.emit('handleClickedLink', {request, tab});

    if (this.cancelRequest(request)) {
      debug('[handleClickedLink] canceling request', request, tab);
      return { cancel: true };
    }

    if (typeof hook[0] !== 'undefined' && !hook[0]) {
      debug('[handleClickedLink] maclegacy return', request, tab);
      return;
    }

    if (tab.cookieStoreId !== 'firefox-default' &&
        this.container.urlCreatedContainer[request.url] === tab.cookieStoreId) {
      debug('[handleClickedLink] link click already created this container, we can stop here', request, tab);
      return;
    }

    let deletesHistoryContainer = false;
    if (this.storage.local.tempContainers[tab.cookieStoreId] &&
        this.storage.local.tempContainers[tab.cookieStoreId].deletesHistory &&
        this.storage.local.preferences.deletesHistoryContainerMouseClicks === 'automatic') {
      deletesHistoryContainer = true;
    }

    if (macAssignment) {
      debug('[handleClickedLink] decided to reopen but mac assigned, reopen confirmpage', request, tab, macAssignment);
      this.mac.maybeReopenConfirmPage(macAssignment, request, tab, deletesHistoryContainer);
      return;
    }

    let newTab;
    if (this.mouseclick.linksClicked[request.url] &&
        this.mouseclick.linksClicked[request.url].clickType === 'left') {
      debug('[handleClickedLink] creating new container because request got left clicked', this.mouseclick.linksClicked[request.url], tab);
      newTab = await this.container.createTabInTempContainer({tab, active: true, url: request.url, deletesHistory: deletesHistoryContainer, request});
      if (this.mouseclick.linksClicked[request.url].tab.id !== tab.id) {
        debug('[handleClickedLink] looks like the left clicked opened a new tab, remove it', tab);
        await this.container.removeTab(tab);
      }
    } else {
      newTab = await this.container.reloadTabInTempContainer(tab, request.url, null, deletesHistoryContainer, request);
    }
    debug('[handleClickedLink] created new tab', newTab);
    await this.background.emit('handleClickedLinkAfterReload', {request, newTab});

    debug('[handleClickedLink] canceling request', request);
    return { cancel: true };
  }


  async handleNotClickedLink(request, tab, alwaysOpenIn, macAssignment) {
    if (tab.cookieStoreId === 'firefox-default' && tab.openerTabId && !alwaysOpenIn) {
      debug('[webRequestOnBeforeRequest] default container and openerTabId set', tab);
      const openerTab = await browser.tabs.get(tab.openerTabId);
      if (!openerTab.url.startsWith('about:') && !openerTab.url.startsWith('moz-extension:')) {
        debug('[webRequestOnBeforeRequest] request didnt came from about/moz-extension page, we do nothing', openerTab);
        return;
      }
    }
    if (!this.storage.local.preferences.automaticMode && !alwaysOpenIn) {
      debug('[browser.webRequest.onBeforeRequest] got not clicked request but automatic mode is off, ignoring', request);
      return;
    }

    let containerExists = false;
    if (tab.cookieStoreId === 'firefox-default') {
      containerExists = true;
    } else {
      try {
        containerExists = await browser.contextualIdentities.get(tab.cookieStoreId);
      } catch (error) {
        debug('[handleNotClickedLink] container doesnt exist anymore, probably undo close tab', tab);
      }
    }

    const hook = await this.background.emit('handleNotClickedLink', {request, tab, containerExists});
    if (typeof hook[0] !== 'undefined') {
      if (!hook[0]) {
        return;
      }
      if (hook[0].cancel) {
        this.cancelRequest(request);
        return hook[0];
      }
    } else if (tab.cookieStoreId !== 'firefox-default' && containerExists) {
      if (this.shouldCancelRequest(request)) {
        return { cancel: true };
      }
      debug('[handleNotClickedLink] onBeforeRequest tab belongs to a non-default container', tab, request);
      return;
    }

    if (this.cancelRequest(request)) {
      return { cancel: true };
    }

    let deletesHistoryContainer = false;
    if (this.storage.local.preferences.deletesHistoryContainer === 'automatic') {
      deletesHistoryContainer = true;
    }

    if (macAssignment) {
      debug('[handleNotClickedLink] decided to reopen but mac assigned, reopen confirmpage', request, tab, macAssignment);
      this.mac.maybeReopenConfirmPage(macAssignment, request, tab, deletesHistoryContainer);
      return;
    }

    debug('[handleNotClickedLink] onBeforeRequest reload in temp tab', tab, request);
    await this.container.reloadTabInTempContainer(tab, request.url, true, deletesHistoryContainer, request);

    return { cancel: true };
  }


  cancelRequest(request) {
    if (!request ||
      typeof request.requestId === 'undefined' ||
      typeof request.tabId === 'undefined') {
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
      return;
    }

    if (this.canceledRequests[request.tabId] &&
        (this.canceledRequests[request.tabId].requestIds[request.requestId] ||
         this.canceledRequests[request.tabId].urls[request.url])) {
      return true;
    }
    return false;
  }


  shouldAlwaysOpenInTemporaryContainer(request) {
    const parsedRequestURL = new URL(request.url);

    for (let domainPattern in this.storage.local.preferences.alwaysOpenInDomain) {
      if (parsedRequestURL.hostname === domainPattern ||
          parsedRequestURL.hostname.match(globToRegexp(domainPattern))) {
        return true;
      }
    }

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

module.exports = Request;
