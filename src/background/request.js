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

    browser.webRequest.onBeforeRequest.addListener(this.webRequestOnBeforeRequest.bind(this),  {
      urls: ['<all_urls>'],
      types: ['main_frame']
    }, [
      'blocking'
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

    if (this.shouldCancelRequest(request)) {
      debug('[webRequestOnBeforeRequest] we canceled a request with that requestId before, probably redirect, cancel again', request);
      return { cancel: true };
    }

    let tab;
    try {
      tab = await browser.tabs.get(request.tabId);
      debug('[browser.webRequest.onBeforeRequest] onbeforeRequest requested tab information', tab);
    } catch (error) {
      debug('[browser.webRequest.onBeforeRequest] onbeforeRequest retrieving tab information failed', error);

      const hook = await this.background.emit('webRequestOnBeforeRequestFailed', request);
      if (typeof hook[0] !== 'undefined' && hook[0]) {
        tab = hook[0];
      }
    }

    this.container.maybeAddHistory(tab, request.url);
    await this.maybeSetCookies(tab, request.url);

    if (request.url.startsWith('https://getpocket.com')) {
      // TODO consider "Decontain Websites" in the preferences
      // getpocket.com is ignored because of #52
      debug('[webRequestOnBeforeRequest] were ignoring requests to getpocket.com because of #52', request);
      return;
    }

    let alwaysOpenIn = false;
    if (this.shouldAlwaysOpenInTemporaryContainer(request)) {
      debug('[browser.webRequest.onBeforeRequest] always open in tmpcontainer request', request);
      alwaysOpenIn = true;
    } else if (!this.storage.local.preferences.automaticMode &&
               !this.mouseclick.linksClicked[request.url]) {
      debug('[browser.webRequest.onBeforeRequest] automatic mode disabled and no link clicked', request);
      return;
    }

    if (alwaysOpenIn && !this.mouseclick.linksClicked[request.url] && tab.openerTabId) {
      debug('[browser.webRequest.onBeforeRequest] always open in tmpcontainer request, simulating click', request);
      this.linkClicked(request.url, {
        id: tab.openerTabId,
        cookieStoreId: tab.cookieStoreId
      });
    }

    if (tab.incognito) {
      debug('[browser.webRequest.onBeforeRequest] tab is incognito, ignore it', tab);
      return;
    }

    if (!alwaysOpenIn && this.background.noContainerTabs[tab.id]) {
      debug('[browser.webRequest.onBeforeRequest] no container tab, we ignore that', tab);
      return;
    }

    const hook = await this.background.emit('webRequestOnBeforeRequest', {request, tab});
    if (typeof hook[0] !== 'undefined' && !hook[0]) {
      return;
    }

    let returnVal;
    if (this.mouseclick.linksClicked[request.url]) {
      returnVal = await this.handleClickedLink(request, tab);
    } else {
      returnVal = await this.handleNotClickedLink(request, tab, alwaysOpenIn);
    }

    if (returnVal && returnVal.cancel) {
      this.cancelRequest(request);
    }
    return returnVal;
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


  async handleClickedLink(request, tab) {
    debug('[handleClickedLink] onBeforeRequest', request, tab);

    const hook = await this.background.emit('handleClickedLink', {request, tab});

    if (this.cancelRequest(request)) {
      return { cancel: true };
    }

    if (typeof hook[0] !== 'undefined' && !hook[0]) {
      return;
    }

    if (tab.cookieStoreId !== 'firefox-default' &&
        this.container.urlCreatedContainer[request.url] === tab.cookieStoreId) {
      // link click already created this container, we can stop here
      return;
    }

    let deletesHistoryContainer = false;
    if (this.storage.local.tempContainers[tab.cookieStoreId] &&
        this.storage.local.tempContainers[tab.cookieStoreId].deletesHistory &&
        this.storage.local.preferences.deletesHistoryContainerMouseClicks === 'automatic') {
      deletesHistoryContainer = true;
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


  async handleNotClickedLink(request, tab, alwaysOpenIn) {
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
        debug('container doesnt exist anymore, probably undo close tab', tab);
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
    debug('[handleNotClickedLink] onBeforeRequest reload in temp tab', tab, request);
    await this.container.reloadTabInTempContainer(tab, request.url, true, deletesHistoryContainer, request);

    return { cancel: true };
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


  async maybeSetCookies(tab, url) {
    if (!this.storage.local.tempContainers[tab.cookieStoreId]) {
      return;
    }

    try {
      const parsedRequestURL = new URL(url);
      for (let domainPattern in this.storage.local.preferences.setCookiesDomain) {
        if (parsedRequestURL.hostname !== domainPattern &&
            !parsedRequestURL.hostname.match(globToRegexp(domainPattern))) {
          continue;
        }
        for (let cookie of this.storage.local.preferences.setCookiesDomain[domainPattern]) {
          if (!cookie) {
            continue;
          }
          const setCookie = {
            domain: cookie.domain || undefined,
            expirationDate: cookie.expirationDate ? parseInt(cookie.expirationDate) : undefined,
            httpOnly: cookie.httpOnly === '' ? undefined : (cookie.httpOnly === 'true' ? true : false),
            name: cookie.name,
            secure: cookie.secure === '' ? undefined : (cookie.secure === 'true' ? true : false),
            url: cookie.url,
            value: cookie.value || undefined,
            storeId: tab.cookieStoreId
          };
          debug('[maybeSetCookies] setting cookie', cookie, setCookie);
          await browser.cookies.set(setCookie);
        }
      }
    } catch (error) {
      debug('[maybeSetCookies] something went wrong while setting cookies', tab, url, error);
    }
  }
}

module.exports = Request;
