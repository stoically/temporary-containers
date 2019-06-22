class Request {
  constructor(background) {
    this.background = background;
    this.canceledTabs = {};
    this.canceledRequests = {};
    this.requestIdUrlSeen = {};
    this.cleanRequests = {};
    this.lastSeenRequestUrl = {};
  }

  async initialize() {
    this.storage = this.background.storage;
    this.container = this.background.container;
    this.mouseclick = this.background.mouseclick;
    this.browseraction = this.background.browseraction;
    this.mac = this.background.mac;
    this.utils = this.background.utils;
    this.tabs = this.background.tabs;
    this.isolation = this.background.isolation;
    this.management = this.background.management;

    // Clean up canceled requests
    browser.webRequest.onCompleted.addListener((request) => {
      if (this.canceledTabs[request.tabId]) {
        delete this.canceledTabs[request.tabId];
      }
    }, {
      urls: ['<all_urls>'],
      types: ['main_frame']
    });
    browser.webRequest.onErrorOccurred.addListener((request) => {
      if (this.canceledTabs[request.tabId]) {
        delete this.canceledTabs[request.tabId];
      }
    }, {
      urls: ['<all_urls>'],
      types: ['main_frame']
    });
  }


  async webRequestOnBeforeRequest(request) {
    const requestIdUrl = `${request.requestId}+${request.url}`;
    if (requestIdUrl in this.requestIdUrlSeen) {
      return;
    } else {
      this.requestIdUrlSeen[requestIdUrl] = true;
      delay(300000).then(() => {
        delete this.requestIdUrlSeen[requestIdUrl];
      });
    }

    const returnVal = await this._webRequestOnBeforeRequest(request);

    if (!this.lastSeenRequestUrl[request.requestId]) {
      delay(300000).then(() => {
        delete this.lastSeenRequestUrl[request.requestId];
      });
    }
    this.lastSeenRequestUrl[request.requestId] = request.url;

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
    debug('[_webRequestOnBeforeRequest] incoming request', request);
    if (request.tabId === -1) {
      debug('[_webRequestOnBeforeRequest] onBeforeRequest request doesnt belong to a tab, why are you main_frame?', request);
      return;
    }

    this.browseraction.removeBadge(request.tabId);

    if (this.shouldCancelRequest(request)) {
      debug('[_webRequestOnBeforeRequest] canceling', request);
      return { cancel: true };
    }

    let tab, openerTab;
    try {
      tab = await browser.tabs.get(request.tabId);
      if (tab && tab.openerTabId) {
        openerTab = await browser.tabs.get(tab.openerTabId);
      }
      debug('[_webRequestOnBeforeRequest] onbeforeRequest requested tab information', tab, openerTab);
    } catch (error) {
      debug('[_webRequestOnBeforeRequest] onbeforeRequest retrieving tab information failed, mac was probably faster', error);
    }

    if (tab && tab.incognito) {
      debug('[_webRequestOnBeforeRequest] tab is incognito, ignore it', tab);
      return;
    }

    if (tab && this.container.isPermanent(tab.cookieStoreId) &&
      this.storage.local.preferences.isolation.global.excludedContainers[tab.cookieStoreId]) {
      debug('[_webRequestOnBeforeRequest] container on global excluded list, we do nothing', tab);
      return;
    }

    let macAssignment;
    if (this.management.addons['@testpilot-containers'].enabled) {
      try {
        macAssignment = await this.mac.getAssignment(request.url);
      } catch (error) {
        debug('[_webRequestOnBeforeRequest] contacting mac failed, probably old version', error);
      }
    }
    if (macAssignment) {
      if (macAssignment.neverAsk) {
        debug('[_webRequestOnBeforeRequest] mac neverask assigned, we do nothing', macAssignment);
        return;
      } else {
        debug('[_webRequestOnBeforeRequest] mac assigned', macAssignment);
      }
    }

    const parsedUrl = new URL(request.url);

    if (this.management.addons['containerise@kinte.sh'].enabled) {
      try {
        const hostmap = await browser.runtime.sendMessage('containerise@kinte.sh', {
          method: 'getHostMap',
          url: request.url
        });
        if (typeof hostmap === 'object' && hostmap.cookieStoreId && hostmap.enabled) {
          debug('[_webRequestOnBeforeRequest] assigned with containerise we do nothing', hostmap);
          return;
        } else {
          debug('[_webRequestOnBeforeRequest] not assigned with containerise', hostmap);
        }
      } catch (error) {
        debug('[_webRequestOnBeforeRequest] contacting containerise failed, probably old version', error);
      }
    }

    if (this.management.addons['block_outside_container@jspenguin.org'].enabled) {
      try {
        let response = await browser.runtime.sendMessage('block_outside_container@jspenguin.org', {
          action: 'rule_exists',
          domain: parsedUrl.hostname,
        });
        if (response.rule_exists) {
          debug('[_webRequestOnBeforeRequest] assigned with block_outside_container we do nothing');
          return;
        } else {
          debug('[_webRequestOnBeforeRequest] not assigned with block_outside_container');
        }
      } catch (error) {
        debug('[_webRequestOnBeforeRequest] contacting block_outside_container failed', error);
      }
    }

    const parsedTabUrl = tab && /^https?:/.test(tab.url) && new URL(tab.url);
    const parsedOpenerTabUrl = openerTab && /^https?:/.test(openerTab.url) && new URL(openerTab.url);
    for (const containWhat of ['@contain-facebook', '@contain-google', '@contain-twitter', '@contain-youtube']) {
      if (!this.management.addons[containWhat].enabled) {
        continue;
      }
      for (const RE of this.management.addons[containWhat].REs) {
        if (RE.test(parsedUrl.hostname) ||
           (parsedTabUrl && RE.test(parsedTabUrl.hostname)) ||
           (parsedOpenerTabUrl && RE.test(parsedOpenerTabUrl.hostname))) {
          debug('[_webRequestOnBeforeRequest] handled by active container addon, ignoring', containWhat, RE, request.url);
          return;
        }
      }
    }

    this.container.maybeAddHistory(tab, request.url);

    if ((request.url.startsWith('http://addons.mozilla.org') ||
        request.url.startsWith('https://addons.mozilla.org')) &&
        this.storage.local.preferences.ignoreRequestsToAMO) {
      debug('[_webRequestOnBeforeRequest] we are ignoring requests to addons.mozilla.org because we arent allowed to cancel requests anyway', request);
      return;
    }

    if (request.url.startsWith('https://getpocket.com') &&
        this.storage.local.preferences.ignoreRequestsToPocket) {
      debug('[_webRequestOnBeforeRequest] we are ignoring requests to getpocket.com because of #52', request);
      return;
    }

    const isolated = !macAssignment && await this.maybeIsolate(tab, request, openerTab);
    if (isolated) {
      debug('[_webRequestOnBeforeRequest] we decided to isolate and open new tmpcontainer', request);
      return isolated;
    }

    const alwaysOpenIn = !macAssignment &&
      await this.maybeAlwaysOpenInTemporaryContainer(tab, request, openerTab);
    if (alwaysOpenIn) {
      debug('[_webRequestOnBeforeRequest] we decided to always open in new tmpcontainer', request);
      return alwaysOpenIn;
    } else if (!this.storage.local.preferences.automaticMode.active &&
               !this.mouseclick.linksClicked[request.url]) {
      debug('[_webRequestOnBeforeRequest] automatic mode disabled and no link clicked', request);
      return;
    } else if (this.mouseclick.unhandledLinksClicked[request.url]) {
      debug('[_webRequestOnBeforeRequest] we saw an unhandled click for that url', request);
      return;
    }

    if (this.container.noContainerTabs[request.tabId]) {
      debug('[_webRequestOnBeforeRequest] no container tab, we ignore that', tab);
      return;
    }

    if (this.mouseclick.linksClicked[request.url]) {
      return this.handleClickedLink(request, tab, macAssignment);
    } else {
      return this.handleNotClickedLink(request, tab, macAssignment, openerTab);
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
        this.container.isTemporary(tab.cookieStoreId, 'deletesHistory') &&
        this.storage.local.preferences.deletesHistory.containerMouseClicks === 'automatic') {
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
      newTab = await this.container.createTabInTempContainer({
        tab,
        url: request.url,
        deletesHistory: deletesHistoryContainer,
        request
      });
      if (tab && this.mouseclick.linksClicked[request.url].tab.id !== tab.id) {
        debug('[handleClickedLink] looks like the left clicked opened a new tab, remove it', tab);
        await this.tabs.remove(tab);
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


  async handleNotClickedLink(request, tab, macAssignment, openerTab) {
    debug('[handleNotClickedLink] onBeforeRequest', request, tab);

    if (tab && tab.cookieStoreId === 'firefox-default' && openerTab) {
      debug('[handleNotClickedLink] default container and openerTab', openerTab);
      if (!openerTab.url.startsWith('about:') && !openerTab.url.startsWith('moz-extension:')) {
        debug('[handleNotClickedLink] request didnt came from about/moz-extension page, we do nothing', openerTab);
        return;
      }
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
        debug('[handleNotClickedLink] the request url is mac assigned to this container, we do nothing');
        return;
      }
    }

    let deletesHistoryContainer = false;
    if (this.storage.local.preferences.deletesHistory.automaticMode === 'automatic') {
      deletesHistoryContainer = true;
    }

    if (macAssignment) {
      if (tab && tab.cookieStoreId && this.container.isTemporary(tab.cookieStoreId)) {
        debug('[handleNotClickedLink] mac assigned but we are already in a tmp container, we do nothing', request, tab, macAssignment);
        return;
      }
      debug('[handleNotClickedLink] decided to reopen but mac assigned, maybe reopen confirmpage', request, tab, macAssignment);
      return this.mac.maybeReopenConfirmPage(macAssignment, request, tab, deletesHistoryContainer);
    }

    if (this.cancelRequest(request)) {
      return { cancel: true };
    }

    debug('[handleNotClickedLink] onBeforeRequest reload in temp tab', tab, request);
    await this.container.reloadTabInTempContainer({
      tab,
      url: request.url,
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

    if (!this.canceledRequests[request.requestId]) {
      this.canceledRequests[request.requestId] = true;
      // requestIds are unique per session, so we have no pressure to remove them
      setTimeout(() => {
        debug('[webRequestOnBeforeRequest] cleaning up canceledRequests', request);
        delete this.canceledRequests[request.requestId];
      }, 300000);
    }

    if (!this.canceledTabs[request.tabId]) {
      debug('[cancelRequest] marked request as canceled', request);
      // workaround until https://bugzilla.mozilla.org/show_bug.cgi?id=1437748 is resolved
      this.canceledTabs[request.tabId] = {
        requestIds: {
          [request.requestId]: true
        },
        urls: {
          [request.url]: true
        }
      };
      // cleanup canceledTabs later
      setTimeout(() => {
        debug('[webRequestOnBeforeRequest] cleaning up canceledTabs', request);
        delete this.canceledTabs[request.tabId];
      }, 2000);
      return false;
    } else {
      debug('[cancelRequest] already canceled', request, this.canceledTabs);
      let cancel = false;
      if (this.shouldCancelRequest(request)) {
        // same requestId or url from the same tab, this is a redirect that we have to cancel to prevent opening two tabs
        cancel = true;
      }
      // we decided to cancel the request at this point, register canceled request
      this.canceledTabs[request.tabId].requestIds[request.requestId] = true;
      this.canceledTabs[request.tabId].urls[request.url] = true;
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

    if (this.canceledRequests[request.requestId] ||
        (this.canceledTabs[request.tabId] &&
         (this.canceledTabs[request.tabId].requestIds[request.requestId] ||
          this.canceledTabs[request.tabId].urls[request.url]))) {
      return true;
    }
    return false;
  }


  async maybeIsolate(tab, request, openerTab) {
    if (!tab || !tab.url) {
      debug('[maybeIsolate] we cant proceed without tab url information', tab, request);
      return false;
    }

    if (!await this.shouldIsolate(tab, request, openerTab)) {
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
      url: request.url,
      request,
      deletesHistory: this.storage.local.preferences.deletesHistory.containerIsolation === 'automatic'
    };
    if (tab.url === 'about:home' || tab.url === 'about:newtab' || tab.url === 'about:blank' ||
        this.storage.local.preferences.replaceTabs) {
      await this.container.reloadTabInTempContainer(params);
    } else {
      await this.container.createTabInTempContainer(params);
    }
    return {cancel: true};
  }


  async shouldIsolate(tab, request, openerTab) {
    debug('[shouldIsolate]', tab, request);
    if (this.container.isClean(tab.cookieStoreId)) {
      debug('[shouldIsolate] not isolating because the tmp container is still clean');
      return false;
    }

    if (this.shouldIsolateMac(tab)) {
      debug('[shouldIsolate] mac isolation');
      return true;
    }

    if ((tab.url === 'about:blank' || tab.url === 'about:newtab' || tab.url === 'about:home') && !openerTab) {
      debug('[shouldIsolate] not isolating because the tab url is blank/newtab/home and no openerTab');
      return false;
    }

    if (openerTab && tab.url === 'about:blank') {
      debug('[shouldIsolate] we have to check the opener against the request', openerTab);

      if (this.container.isPermanent(tab.cookieStoreId) &&
          openerTab.cookieStoreId !== tab.cookieStoreId) {
        debug('[shouldIsolate] the tab loads a permanent container that is different from the openerTab, probaby explicitly selected in the context menu');
        return false;
      }

      if (await this.shouldIsolate(openerTab, request, false)) {
        debug('[shouldIsolate] decided to isolate because of opener', openerTab);
        return true;
      }

      debug('[shouldIsolate] decided to not isolate because of opener', openerTab);
      return false;
    }

    const url = this.lastSeenRequestUrl[request.requestId] &&
      this.lastSeenRequestUrl[request.requestId] !== tab.url ?
      this.lastSeenRequestUrl[request.requestId] : tab.url;
    const parsedURL = new URL(url);
    const parsedRequestURL = new URL(request.url);

    for (let domainPattern in this.storage.local.preferences.isolation.domain) {
      if (!this.isolation.matchDomainPattern(tab.url, domainPattern)) {
        continue;
      }

      const patternPreferences = this.storage.local.preferences.isolation.domain[domainPattern];
      if (patternPreferences.excluded) {
        for (const excludedDomainPattern of Object.keys(patternPreferences.excluded)) {
          if (!this.isolation.matchDomainPattern(request.url, excludedDomainPattern)) {
            debug('[shouldIsolate] excluded domain pattern not matching', request.url, excludedDomainPattern);
            continue;
          }
          debug('[shouldIsolate] not isolating because excluded domain pattern matches', request.url, excludedDomainPattern);
          return false;
        }
      }

      const navigationPreferences = patternPreferences.navigation;
      if (!navigationPreferences) {
        continue;
      }
      debug('[shouldIsolate] found pattern', domainPattern, navigationPreferences);

      if (navigationPreferences.action === 'global') {
        debug('[shouldIsolate] breaking because "global"');
        break;
      }

      return await this.checkIsolationPreferenceAgainstUrl(
        navigationPreferences.action, parsedURL.hostname, parsedRequestURL.hostname, tab
      );
    }

    if (await this.checkIsolationPreferenceAgainstUrl(
      this.storage.local.preferences.isolation.global.navigation.action,
      parsedURL.hostname,
      parsedRequestURL.hostname,
      tab
    )) {
      return true;
    }

    debug('[shouldIsolate] not isolating');
    return false;
  }

  shouldIsolateMac(tab) {
    if (this.storage.local.preferences.isolation.mac.action === 'disabled') {
      debug('[shouldIsolateMac] mac isolation disabled');
      return false;
    }
    if (this.container.isPermanent(tab.cookieStoreId)) {
      debug('[shouldIsolateMac] mac isolating because request url is not assigned to the tabs permanent container');
      return true;
    }
    return false;
  }

  async checkIsolationPreferenceAgainstUrl(preference, origin, target, tab) {
    debug('[checkIsolationPreferenceAgainstUrl]', preference, origin, target, tab);
    switch (preference) {
    case 'always':
      debug('[checkIsolationPreferenceAgainstUrl] isolating based on "always"');
      return true;

    case 'notsamedomainexact':
      if (target !== origin) {
        debug('[checkIsolationPreferenceAgainstUrl] isolating based on "notsamedomainexact"');
        return true;
      }
      break;

    case 'notsamedomain':
      if (!this.utils.sameDomain(origin, target)) {
        debug('[checkIsolationPreferenceAgainstUrl] isolating based on "notsamedomain"');
        return true;
      }
      break;
    }
    return false;
  }


  async maybeAlwaysOpenInTemporaryContainer(tab, request, openerTab) {
    if (!Object.keys(this.storage.local.preferences.isolation.domain).length) {
      return;
    }
    if (!tab || !tab.url) {
      debug('[maybeAlwaysOpenInTemporaryContainer] we cant proceed without tab url information', tab, request);
      return false;
    }

    if (this.container.isClean(tab.cookieStoreId)) {
      debug('[maybeAlwaysOpenInTemporaryContainer] not reopening because the tmp container is still clean');
      if (!this.cleanRequests[request.requestId]) {
        this.cleanRequests[request.requestId] = true;
        delay(300000).then(() => {
          delete this.cleanRequests[request.requestId];
        });
      }
      return false;
    }

    if (this.cleanRequests[request.requestId]) {
      debug('[maybeAlwaysOpenInTemporaryContainer] not reopening because of clean requests, redirect', request);
      return false;
    }

    let reopen = false;
    debug('[maybeAlwaysOpenInTemporaryContainer]',
      tab, request);

    for (let domainPattern in this.storage.local.preferences.isolation.domain) {
      if (!this.isolation.matchDomainPattern(request.url, domainPattern)) {
        continue;
      }

      const preferences = this.storage.local.preferences.isolation.domain[domainPattern].always;
      debug('[maybeAlwaysOpenInTemporaryContainer] found pattern for incoming request url', domainPattern, preferences);
      if (preferences.action === 'disabled') {
        debug('[maybeAlwaysOpenInTemporaryContainer] not reopening because "always" disabled');
        continue;
      }

      if (preferences.allowedInPermanent && this.container.isPermanent(tab.cookieStoreId)) {
        debug('[maybeAlwaysOpenInTemporaryContainer] not reopening because allowed to load in permanent container');
        continue;
      }

      if (!this.container.isTemporary(tab.cookieStoreId)) {
        debug('[maybeAlwaysOpenInTemporaryContainer] reopening because not in a tmp container');
        reopen = true;
        break;
      }

      if (!this.isolation.matchDomainPattern(tab.url, domainPattern)) {
        let openerMatches = false;
        if (openerTab && !openerTab.url.startsWith('about:') &&
            this.isolation.matchDomainPattern(openerTab.url, domainPattern)) {
          openerMatches = true;
          debug('[maybeAlwaysOpenInTemporaryContainer] opener tab url matched the pattern', openerTab.url, domainPattern);
        }
        if (!openerMatches) {
          debug('[maybeAlwaysOpenInTemporaryContainer] reopening because the tab/opener url doesnt match the pattern', tab.url, openerTab, domainPattern);
          reopen = true;
          break;
        }
      }
    }

    if (reopen) {
      if (this.cancelRequest(request)) {
        debug('[maybeAlwaysOpenInTemporaryContainer] canceling request');
        return { cancel: true };
      }

      const deletesHistory = this.storage.local.preferences.deletesHistory.containerAlwaysPerDomain === 'automatic';
      const params = {
        tab,
        url: request.url,
        request,
        deletesHistory
      };
      if (tab.url === 'about:home' || tab.url === 'about:newtab' || tab.url === 'about:blank') {
        await this.container.reloadTabInTempContainer(params);
      } else {
        await this.container.createTabInTempContainer(params);
      }
      return {cancel: true};
    }

    debug('[maybeAlwaysOpenInTemporaryContainer] nothing matched, we do nothing', request);
    return false;
  }
}

window.Request = Request;
