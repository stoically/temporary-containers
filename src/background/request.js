const { globToRegexp } = require('./utils');
const { debug } = require('./log');

class Request {
  async initialize(background) {
    this.background = background;
    this.storage = background.storage;
    this.container = background.container;
    this.automaticModeState = background.automaticModeState;
  }


  async webRequestOnBeforeRequest(request) {
    debug('[browser.webRequest.onBeforeRequest] incoming request', request);
    if (request.tabId === -1) {
      debug('[browser.webRequest.onBeforeRequest] onBeforeRequest request doesnt belong to a tab, why are you main_frame?', request);
      return;
    }
    let alwaysOpenIn = false;
    if (this.shouldAlwaysOpenInTemporaryContainer(request)) {
      debug('[browser.webRequest.onBeforeRequest] always open in tmpcontainer request', request);
      alwaysOpenIn = true;
    } else if (!this.storage.local.preferences.automaticMode &&
               !this.automaticModeState.linkClicked[request.url]) {
      debug('[browser.webRequest.onBeforeRequest] automatic mode disabled and no link clicked', request);
      return;
    }

    let tab;
    try {
      tab = await browser.tabs.get(request.tabId);
      debug('[browser.webRequest.onBeforeRequest] onbeforeRequest requested tab information', tab);
    } catch (error) {
      debug('[browser.webRequest.onBeforeRequest] onbeforeRequest retrieving tab information failed', error);

      const hook = await this.background.emit('webRequestOnBeforeRequestFailed', request);
      tab = hook[0];
    }

    if (alwaysOpenIn && !this.automaticModeState.linkClicked[request.url] && tab.openerTabId) {
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

    if (!alwaysOpenIn && this.automaticModeState.noContainerTab[tab.id]) {
      debug('[browser.webRequest.onBeforeRequest] no container tab, we ignore that', tab);
      return;
    }

    const hook = await this.background.emit('webRequestOnBeforeRequest', {request, tab});
    if (!hook[0]) {
      return;
    }

    if (this.automaticModeState.linkClicked[request.url]) {
      // when someone clicks links fast in succession not clicked links
      // might get confused with clicked links :C
      if (!this.automaticModeState.linkClicked[request.url].tabs[tab.openerTabId]) {
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


  linkClicked(url, tab) {
    if (!this.automaticModeState.linkClicked[url]) {
      this.automaticModeState.linkClicked[url] = {
        tabs: {},
        containers: {},
        count: 0
      };
    }
    this.automaticModeState.linkClicked[url].tab = tab;
    this.automaticModeState.linkClicked[url].tabs[tab.id] = true;
    this.automaticModeState.linkClicked[url].containers[tab.cookieStoreId] = true;
    this.automaticModeState.linkClicked[url].count++;

    setTimeout(() => {
      debug('[runtimeOnMessage] cleaning up', url);
      this.cleanupAutomaticModeState(url);
    }, 1000);
  }


  cleanupAutomaticModeState(url) {
    delete this.automaticModeState.linkClicked[url];
    delete this.automaticModeState.linkClickCreatedTabs[url];
    delete this.automaticModeState.linkCreatedContainer[url];
    delete this.automaticModeState.alreadySawThatLink[url];
    delete this.automaticModeState.alreadySawThatLinkTotal[url];
    delete this.automaticModeState.alreadySawThatLinkInNonDefault[url];
    delete this.automaticModeState.multiAccountConfirmPage[url];
    delete this.automaticModeState.multiAccountConfirmPageTabs[url];
    delete this.automaticModeState.multiAccountWasFaster[url];
    delete this.automaticModeState.multiAccountRemovedTab[url];
  }


  async handleClickedLink(request, tab) {
    debug('[handleClickedLink] onBeforeRequest', request, tab, JSON.stringify(this.automaticModeState));

    const hook = await this.background.emit('handleClickedLink', {request, tab});
    if (!hook[0]) {
      return;
    }

    if (tab.cookieStoreId !== 'firefox-default' &&
        this.automaticModeState.linkCreatedContainer[request.url] === tab.cookieStoreId) {
      // link click already created this container, we can stop here
      return;
    }

    let newTab;
    newTab = await this.container.reloadTabInTempContainer(tab, request.url);
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

    if (tab.cookieStoreId !== 'firefox-default' && containerExists) {
      debug('[handleNotClickedLink] onBeforeRequest tab belongs to a non-default container', tab, request);
      this.automaticModeState.alreadySawThatLinkInNonDefault[request.url] = true;
      return;
    }

    const hook = await this.background.emit('handleNotClickedLink', {request, tab, containerExists});
    if (!hook[0]) {
      return;
    }
    if (hook[0].cancel) {
      return hook[0];
    }

    debug('[handleNotClickedLink] onBeforeRequest reload in temp tab', tab, request);
    await this.container.reloadTabInTempContainer(tab, request.url, true);

    return { cancel: true };
  }


  checkClickPreferences(preferences, parsedClickedURL, parsedSenderTabURL) {
    if (preferences.action === 'never') {
      return false;
    }

    if (preferences.action === 'notsamedomainexact') {
      if (parsedSenderTabURL.hostname !== parsedClickedURL.hostname) {
        debug('[browser.runtime.onMessage] click not handled based on global preference "notsamedomainexact"');
        return true;
      } else {
        debug('[browser.runtime.onMessage] click handled based on global preference "notsamedomainexact"');
        return false;
      }
    }

    if (preferences.action === 'notsamedomain') {
      const splittedClickedHostname = parsedClickedURL.hostname.split('.');
      const checkHostname = '.' + (splittedClickedHostname.splice(-2).join('.'));
      const dottedParsedSenderTabURL = '.' + parsedSenderTabURL.hostname;

      if (parsedClickedURL.hostname.length > 1 &&
          (dottedParsedSenderTabURL.endsWith(checkHostname) ||
           checkHostname.endsWith(dottedParsedSenderTabURL))) {
        debug('[browser.runtime.onMessage] click handled from global preference "notsamedomain"');
        return false;
      } else {
        debug('[browser.runtime.onMesbrowser.commands.onCommand.addListenersage] click not handled from global preference "notsamedomain"');
        return true;
      }
    }

    return true;
  }


  checkClick(type, message, sender) {
    const parsedSenderTabURL = new URL(sender.tab.url);
    const parsedClickedURL = new URL(message.linkClicked.href);

    for (let domainPattern in this.storage.local.preferences.linkClickDomain) {
      if (parsedSenderTabURL.hostname !== domainPattern &&
          !parsedSenderTabURL.hostname.match(globToRegexp(domainPattern))) {
        continue;
      }
      const domainPatternPreferences = this.storage.local.preferences.linkClickDomain[domainPattern];
      if (!domainPatternPreferences[type]) {
        continue;
      }
      return this.checkClickPreferences(domainPatternPreferences[type],
        parsedClickedURL, parsedSenderTabURL);
    }

    return this.checkClickPreferences(this.storage.local.preferences.linkClickGlobal[type],
      parsedClickedURL, parsedSenderTabURL);
  }


  isClickAllowed(message, sender) {
    if (message.linkClicked.event.button === 1) {
      return this.checkClick('middle', message, sender);
    }

    if (message.linkClicked.event.button === 0 &&
      (message.linkClicked.event.ctrlKey || message.linkClicked.event.metaKey)) {
      return this.checkClick('ctrlleft', message, sender);
    }
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
