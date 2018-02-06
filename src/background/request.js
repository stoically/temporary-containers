const { globToRegexp } = require('./utils');
const { debug } = require('./log');

class Request {
  async initialize(background) {
    this.background = background;
    this.storage = background.storage;
    this.container = background.container;
    this.mouseclick = background.mouseclick;
  }


  async webRequestOnBeforeRequest(request) {
    debug('[browser.webRequest.onBeforeRequest] incoming request', request);
    if (request.tabId === -1) {
      debug('[browser.webRequest.onBeforeRequest] onBeforeRequest request doesnt belong to a tab, why are you main_frame?', request);
      return;
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

    if (this.mouseclick.linksClicked[request.url]) {
      // when someone clicks links fast in succession not clicked links
      // might get confused with clicked links :C
      if (!this.mouseclick.linksClicked[request.url].tabs[tab.openerTabId]) {
        debug('[webRequestOnBeforeRequest] warning, linked clicked but we dont know the opener', tab, request);
      }
      return await this.handleClickedLink(request, tab, alwaysOpenIn);
    } else {
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
      return await this.handleNotClickedLink(request, tab, alwaysOpenIn);
    }
  }


  async handleClickedLink(request, tab) {
    debug('[handleClickedLink] onBeforeRequest', request, tab);

    const hook = await this.background.emit('handleClickedLink', {request, tab});
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

    const newTab = await this.container.reloadTabInTempContainer(tab, request.url, null, deletesHistoryContainer);
    debug('[handleClickedLink] created new tab', newTab);

    await this.background.emit('handleClickedLinkAfterReload', {request, newTab});

    debug('[handleClickedLink] canceling request', request);
    return { cancel: true };
  }


  async handleNotClickedLink(request, tab) {
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
        return hook[0];
      }
    } else if (tab.cookieStoreId !== 'firefox-default' && containerExists) {
      debug('[handleNotClickedLink] onBeforeRequest tab belongs to a non-default container', tab, request);
      return;
    }

    let deletesHistoryContainer = false;
    if (this.storage.local.preferences.deletesHistoryContainer === 'automatic') {
      deletesHistoryContainer = true;
    }
    debug('[handleNotClickedLink] onBeforeRequest reload in temp tab', tab, request);
    await this.container.reloadTabInTempContainer(tab, request.url, true, deletesHistoryContainer);

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
}

module.exports = Request;
