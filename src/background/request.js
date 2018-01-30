const { globToRegexp } = require('./utils');
const { debug } = require('./log');

class Request {
  initialize(background) {
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
      // this should only happen if multi-account-containers was fast and removed the tab already
      if (!this.automaticModeState.multiAccountRemovedTab[request.url]) {
        this.automaticModeState.multiAccountRemovedTab[request.url] = 0;
      }
      this.automaticModeState.multiAccountRemovedTab[request.url]++;
      tab = {
        id: request.tabId,
        cookieStoreId: 'firefox-default'
      };
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

    if (!this.automaticModeState.alreadySawThatLinkTotal[request.url]) {
      this.automaticModeState.alreadySawThatLinkTotal[request.url] = 0;

      setTimeout(() => {
        // we need to cleanup in case multi-account is not intervening
        // this also means that there might be unexpected behavior when
        // someone clicks the same link while this hasn't run
        debug('[webRequestOnBeforeRequest] cleaning up', request.url);
        this.cleanupAutomaticModeState(request.url);
      }, 1000);
    }
    this.automaticModeState.alreadySawThatLinkTotal[request.url]++;

    if (this.automaticModeState.alreadySawThatLinkTotal[request.url] > 3) {
      debug('saw the link 4 times - thats enough, stop', JSON.stringify(this.automaticModeState));
      return;
    }

    if (tab.cookieStoreId !== 'firefox-default' && this.automaticModeState.alreadySawThatLink[request.url]) {
      debug('[browser.webRequest.onBeforeRequest] tab is loading an url that we saw before in non-default container',
        tab, JSON.stringify(this.automaticModeState), JSON.stringify(this.storage.local.tempContainers));

      let dontRemoveTab = false;
      if (this.automaticModeState.alreadySawThatLinkTotal[request.url] === 2 &&
          !this.storage.local.tempContainers[tab.cookieStoreId] &&
          !this.automaticModeState.linkClicked[request.url] &&
          !this.automaticModeState.alreadySawThatLinkInNonDefault[request.url] &&
          !this.automaticModeState.multiAccountWasFaster[request.url] &&
          !this.automaticModeState.multiAccountConfirmPage[request.url] &&
          !this.automaticModeState.multiAccountRemovedTab[request.url]) {
        // excuse me but LUL, i might go insane if i have to handle more MAC race-conditions
        dontRemoveTab = true;
      }

      if (!dontRemoveTab && !this.storage.local.tempContainers[tab.cookieStoreId] &&
          (!this.automaticModeState.linkClicked[request.url] ||
          !this.automaticModeState.linkClicked[request.url].containers[tab.cookieStoreId]) &&
          !this.automaticModeState.alreadySawThatLinkInNonDefault[request.url] &&
          !this.automaticModeState.multiAccountWasFaster[request.url]) {
        this.automaticModeState.alreadySawThatLinkInNonDefault[request.url] = true;
        debug('[browser.webRequest.onBeforeRequest] just close it', tab);
        await this.container.removeTab(tab);
        debug('[browser.webRequest.onBeforeRequest] removed tab (probably multi-account-containers huh)', tab.id);
      }
      delete this.automaticModeState.alreadySawThatLink[request.url];
      return;
    }
    if (!this.automaticModeState.alreadySawThatLink[request.url]) {
      this.automaticModeState.alreadySawThatLink[request.url] = 0;
    }
    this.automaticModeState.alreadySawThatLink[request.url]++;

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
    delete this.automaticModeState.alreadySawThatLink[url];
    delete this.automaticModeState.alreadySawThatLinkTotal[url];
    delete this.automaticModeState.alreadySawThatLinkInNonDefault[url];
    delete this.automaticModeState.multiAccountConfirmPage[url];
    delete this.automaticModeState.multiAccountWasFaster[url];
    delete this.automaticModeState.multiAccountRemovedTab[url];
  }


  async handleClickedLink(request, tab) {
    debug('[handleClickedLink] onBeforeRequest', request, tab, JSON.stringify(this.automaticModeState));

    if (!tab) {
      debug('[handleClickedLink] multi-account-containers mightve removed the tab, continue', request.tabId);
    }

    if (tab.cookieStoreId === 'firefox-default'
        && this.automaticModeState.multiAccountConfirmPage[request.url]
        && this.automaticModeState.alreadySawThatLink[request.url] > 1) {
      debug('[handleClickedLink] default container and we saw a mac confirm page + link more than once already, i guess we can stop here');
      return;
    }

    if (tab.cookieStoreId === 'firefox-default'
        && this.automaticModeState.multiAccountRemovedTab[request.url]
        && this.automaticModeState.alreadySawThatLink[request.url] > 1) {
      debug('[handleClickedLink] default container and we saw no mac confirm page + link more than once already, special case, remove tab');
      await this.container.removeTab(tab);
      return;
    }

    if (this.automaticModeState.linkClickCreatedTabs[request.url] &&
        this.automaticModeState.alreadySawThatLinkInNonDefault[request.url] &&
        !this.automaticModeState.multiAccountConfirmPage[request.url] &&
        !this.automaticModeState.multiAccountRemovedTab[request.url]) {
      debug('[handleClickedLink] actually i have no idea what im doing, pls merge the pull request mac :C');
      return;
    }

    if (!tab.openerTabId && !this.storage.local.tabContainerMap[tab.id] &&
        !this.automaticModeState.multiAccountConfirmPage[request.url] &&
        !this.automaticModeState.alreadySawThatLinkInNonDefault[request.url]) {
      debug('[handleClickedLink] no openerTabId and not in the tabContainerMap means probably ' +
        'multi-account reloaded the url ' +
        'in another tab, so were going either to close the tabs weve opened for that ' +
        'link so far or inform our future self');

      if (!this.automaticModeState.linkClickCreatedTabs[request.url] &&
          !this.automaticModeState.multiAccountWasFaster[request.url]) {
        debug('[handleClickedLink] informing future self');
        this.automaticModeState.multiAccountWasFaster[request.url] = tab.id;
      } else {
        const clickCreatedTabId = this.automaticModeState.linkClickCreatedTabs[request.url];
        debug('[handleClickedLink] removing tab', clickCreatedTabId);
        try {
          await this.container.removeTab({id: clickCreatedTabId});
          debug('[handleClickedLink] removed tab', clickCreatedTabId);
          delete this.automaticModeState.linkClickCreatedTabs[request.url];
        } catch (error) {
          debug('[handleClickedLink] something went wrong while removing tab', clickCreatedTabId, error);
        }
      }
      return;
    }

    let newTab;
    newTab = await this.container.reloadTabInTempContainer(tab, request.url);
    debug('[handleClickedLink] created new tab', newTab);
    if (this.automaticModeState.multiAccountWasFaster[request.url]) {
      const multiAccountTabId = this.automaticModeState.multiAccountWasFaster[request.url];
      debug('[handleClickedLink] multi-account was faster and created a tab, remove the tab again', multiAccountTabId);
      try {
        await this.container.removeTab({id: multiAccountTabId});
        debug('[handleClickedLink] removed tab', multiAccountTabId);
      } catch (error) {
        debug('[handleClickedLink] something went wrong while removing tab', multiAccountTabId, error);
      }
      delete this.automaticModeState.multiAccountWasFaster[request.url];
    } else {
      this.automaticModeState.linkClickCreatedTabs[request.url] = newTab.id;
      debug('[handleClickedLink] linkClickCreatedTabs', JSON.stringify(this.automaticModeState.linkClickCreatedTabs));
    }

    debug('[handleClickedLink] canceling request', request);
    return { cancel: true };
  }


  async handleNotClickedLink(request, tab) {
    if (tab.cookieStoreId === 'firefox-default'
        && this.automaticModeState.multiAccountConfirmPage[request.url]
        && this.automaticModeState.alreadySawThatLink[request.url] > 1) {
      debug('[handleNotClickedLink] default container and we saw a mac confirm page + link more than once already, i guess we can stop here');
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

    if (tab.cookieStoreId !== 'firefox-default' && containerExists) {
      debug('[handleNotClickedLink] onBeforeRequest tab belongs to a non-default container', tab, request,
        JSON.stringify(this.automaticModeState.multiAccountConfirmPage), JSON.stringify(this.automaticModeState.alreadySawThatLink));

      if (this.automaticModeState.multiAccountConfirmPage[request.url]) {
        debug('[handleNotClickedLink] we saw a multi account confirm page for that url', request.url);
        delete this.automaticModeState.multiAccountConfirmPage[request.url];
        return;
      } else {
        if (this.automaticModeState.alreadySawThatLinkInNonDefault[request.url] &&
           !this.automaticModeState.alreadySawThatLink[request.url]) {
          if (!this.storage.local.tempContainers[tab.cookieStoreId]) {
            debug('[handleNotClickedLink] we saw that non-default link before, probably multi-account stuff, close tab',
              request.url, JSON.stringify(this.automaticModeState));
            try {
              await this.container.removeTab({id: request.tabId});
            } catch (error) {
              debug('[handleNotClickedLink] removing tab failed', request.tabId, error);
            }
            delete this.automaticModeState.alreadySawThatLinkInNonDefault[request.url];
            return { cancel: true };
          } else {
            delete this.automaticModeState.alreadySawThatLinkInNonDefault[request.url];
          }
        }
      }
      this.automaticModeState.alreadySawThatLinkInNonDefault[request.url] = true;
      return;
    }

    if (this.automaticModeState.multiAccountRemovedTab[request.url] > 1 &&
        !this.automaticModeState.multiAccountConfirmPage[request.url]) {
      debug('[handleNotClickedLink] multi-account-containers already removed a tab before, stop now',
        tab, request, JSON.stringify(this.automaticModeState));
      delete this.automaticModeState.multiAccountRemovedTab[request.url];
      return;
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
