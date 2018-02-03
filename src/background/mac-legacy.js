const { debug } = require('./log');

class MultiAccountContainers {
  constructor(background) {
    this.storage = background.storage;
    this.container = background.container;
    this.request = background.request;
    this.mouseclick = background.mouseclick;

    this.automaticModeState = {
      linkClickCreatedTabs: {},
      alreadySawThatLink: {},
      alreadySawThatLinkTotal: {},
      alreadySawThatLinkInNonDefault: {},
      multiAccountWasFaster: {},
      multiAccountConfirmPage: {},
      multiAccountConfirmPageTabs: {},
      multiAccountRemovedTab: {}
    };

    background.on('webRequestOnBeforeRequestFailed', this.webRequestOnBeforeRequestFailed.bind(this));
    background.on('webRequestOnBeforeRequest', this.webRequestOnBeforeRequest.bind(this));
    background.on('handleClickedLink', this.handleClickedLink.bind(this));
    background.on('handleNotClickedLink', this.handleNotClickedLink.bind(this));
    background.on('handleMultiAccountContainersConfirmPage', this.handleMultiAccountContainersConfirmPage.bind(this));
    background.on('cleanupAutomaticModeState', this.cleanupAutomaticModeState.bind(this));
  }

  async webRequestOnBeforeRequestFailed(request) {
    // this should only happen if multi-account-containers was fast and removed the tab already
    if (!this.automaticModeState.multiAccountRemovedTab[request.url]) {
      this.automaticModeState.multiAccountRemovedTab[request.url] = 0;
    }
    this.automaticModeState.multiAccountRemovedTab[request.url]++;
    return {
      id: request.tabId,
      cookieStoreId: 'firefox-default'
    };
  }

  async webRequestOnBeforeRequest({request, tab}) {
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
      return false;
    }

    if (tab.cookieStoreId !== 'firefox-default' && this.automaticModeState.alreadySawThatLink[request.url]) {
      debug('[browser.webRequest.onBeforeRequest] tab is loading an url that we saw before in non-default container',
        tab, JSON.stringify(this.automaticModeState));

      let dontRemoveTab = false;
      if (this.automaticModeState.alreadySawThatLinkTotal[request.url] === 2 &&
          !this.storage.local.tempContainers[tab.cookieStoreId] &&
          !this.mouseclick.linksClicked[request.url] &&
          !this.automaticModeState.alreadySawThatLinkInNonDefault[request.url] &&
          !this.automaticModeState.multiAccountWasFaster[request.url] &&
          !this.automaticModeState.multiAccountConfirmPage[request.url] &&
          !this.automaticModeState.multiAccountRemovedTab[request.url]) {
        // excuse me but LUL, i might go insane if i have to handle more MAC race-conditions
        dontRemoveTab = true;
      }

      if (!dontRemoveTab && !this.storage.local.tempContainers[tab.cookieStoreId] &&
          (!this.mouseclick.linksClicked[request.url] ||
          !this.mouseclick.linksClicked[request.url].containers[tab.cookieStoreId]) &&
          !this.automaticModeState.alreadySawThatLinkInNonDefault[request.url] &&
          !this.automaticModeState.multiAccountWasFaster[request.url]) {
        this.automaticModeState.alreadySawThatLinkInNonDefault[request.url] = true;
        debug('[browser.webRequest.onBeforeRequest] just close it', tab);
        await this.container.removeTab(tab);
        debug('[browser.webRequest.onBeforeRequest] removed tab (probably multi-account-containers huh)', tab.id);
      }
      delete this.automaticModeState.alreadySawThatLink[request.url];
      return false;
    }
    if (!this.automaticModeState.alreadySawThatLink[request.url]) {
      this.automaticModeState.alreadySawThatLink[request.url] = 0;
    }
    this.automaticModeState.alreadySawThatLink[request.url]++;
    return true;
  }

  async handleMultiAccountContainersConfirmPage(tab) {
    // so this is *probably* the confirm page from multi-account-containers
    // i need to reach out to the multi-account-containers devs, maybe its possible
    // to handle this in a cleaner fashion
    const multiAccountMatch = tab.url.match(/moz-extension:\/\/[^/]*\/confirm-page.html\?url=/);
    if (multiAccountMatch) {
      debug('[handleMultiAccountContainersConfirmPage] is intervening', tab);
      const parsedURL = new URL(tab.url);
      debug('[handleMultiAccountContainersConfirmPage] parsed url', parsedURL);
      const queryParams = parsedURL.search.split('&').map(param => param.split('='));
      debug('[handleMultiAccountContainersConfirmPage] query params', queryParams);
      const multiAccountTargetURL = decodeURIComponent(queryParams[0][1]);
      debug('[handleMultiAccountContainersConfirmPage] target url', multiAccountTargetURL);
      let multiAccountOriginContainer;
      if (queryParams[2]) {
        multiAccountOriginContainer = queryParams[2][1];
        debug('[handleMultiAccountContainersConfirmPage] origin container', multiAccountOriginContainer);
      }

      if (!this.automaticModeState.multiAccountConfirmPageTabs[multiAccountTargetURL]) {
        this.automaticModeState.multiAccountConfirmPageTabs[multiAccountTargetURL] = [];
      }

      if (!this.storage.local.preferences.automaticMode &&
          !this.request.shouldAlwaysOpenInTemporaryContainer({url: multiAccountTargetURL})) {
        return;
      }

      // didnt saw a confirm page before &
      // multiAccountOriginContainer is set to a known temporary container different from the linkclicked.tab container &
      // (optional) the openerTabId matches the linkclicked.tab
      // then we can probably leave this mac confirm open
      // TODO hopefully replace soon with API call to MAC
      let dontCloseThisMacConfirm = false;
      if (!this.automaticModeState.multiAccountConfirmPage[multiAccountTargetURL] &&
          this.storage.local.tempContainers[multiAccountOriginContainer] &&
          this.mouseclick.linksClicked[multiAccountTargetURL] &&
          this.mouseclick.linksClicked[multiAccountTargetURL].tab &&
          multiAccountOriginContainer !== this.mouseclick.linksClicked[multiAccountTargetURL].tab.cookieStoreId) {
        dontCloseThisMacConfirm = true;
      }
      // first MAC confirm for a not clicked link in a non-default container, we probably can leave this open
      if (tab.cookieStoreId !== 'firefox-default' &&
         !this.mouseclick.linksClicked[multiAccountTargetURL] &&
         !this.automaticModeState.alreadySawThatLinkTotal[multiAccountTargetURL] &&
         !this.automaticModeState.multiAccountConfirmPage[multiAccountTargetURL] &&
         !this.automaticModeState.multiAccountRemovedTab[multiAccountTargetURL]) {
        dontCloseThisMacConfirm = true;
        this.automaticModeState.multiAccountConfirmPageTabs[multiAccountTargetURL].push(tab.id);
      } else {
        if (this.automaticModeState.multiAccountConfirmPageTabs[multiAccountTargetURL].length) {
          this.automaticModeState.multiAccountConfirmPageTabs[multiAccountTargetURL].map(tabId => {
            this.container.removeTab({id: tabId});
          });
        }
      }

      if (this.container.urlCreatedContainer[multiAccountTargetURL] && multiAccountOriginContainer &&
          this.container.urlCreatedContainer[multiAccountTargetURL] === multiAccountOriginContainer) {
        dontCloseThisMacConfirm = true;
      }

      if (!this.automaticModeState.multiAccountConfirmPage[multiAccountTargetURL]) {
        this.automaticModeState.multiAccountConfirmPage[multiAccountTargetURL] = 0;
      }
      debug('[handleMultiAccountContainersConfirmPage] debug', JSON.stringify(this.automaticModeState),
        multiAccountTargetURL, multiAccountOriginContainer, tab);
      if (!dontCloseThisMacConfirm &&
          (!this.automaticModeState.alreadySawThatLinkInNonDefault[multiAccountTargetURL] &&
          !this.automaticModeState.multiAccountConfirmPage[multiAccountTargetURL])
          ||
          (multiAccountOriginContainer && this.mouseclick.linksClicked[multiAccountTargetURL] &&
           this.mouseclick.linksClicked[multiAccountTargetURL].containers[multiAccountOriginContainer] &&
           !this.automaticModeState.multiAccountConfirmPage[multiAccountTargetURL])
          ||
          (!multiAccountOriginContainer && tab.cookieStoreId === 'firefox-default')) {
        this.automaticModeState.multiAccountConfirmPage[multiAccountTargetURL]++;
        debug('[handleMultiAccountContainersConfirmPage] we can remove this tab, i guess - and yes this is a bit hacky', tab);
        await this.container.removeTab(tab);
        debug('[handleMultiAccountContainersConfirmPage] removed multi-account-containers tab', tab.id);
        return;
      } else {
        this.automaticModeState.multiAccountConfirmPage[multiAccountTargetURL]++;
      }
    }
  }

  async handleClickedLink({request, tab}) {
    if (!tab) {
      debug('[handleClickedLink] multi-account-containers mightve removed the tab, continue', request.tabId);
    }

    if (tab.cookieStoreId === 'firefox-default'
        && this.automaticModeState.multiAccountConfirmPage[request.url]
        && this.automaticModeState.alreadySawThatLink[request.url] > 1) {
      debug('[handleClickedLink] default container and we saw a mac confirm page + link more than once already, i guess we can stop here');
      return false;
    }

    if (tab.cookieStoreId === 'firefox-default'
        && this.automaticModeState.multiAccountRemovedTab[request.url]
        && this.automaticModeState.alreadySawThatLink[request.url] > 1) {
      debug('[handleClickedLink] default container and we saw no mac confirm page + link more than once already, special case, remove tab');
      await this.container.removeTab(tab);
      return false;
    }

    if (this.automaticModeState.linkClickCreatedTabs[request.url] &&
        this.automaticModeState.alreadySawThatLinkInNonDefault[request.url] &&
        !this.automaticModeState.multiAccountConfirmPage[request.url] &&
        !this.automaticModeState.multiAccountRemovedTab[request.url]) {
      debug('[handleClickedLink] actually i have no idea what im doing, pls merge the pull request mac :C');
      return false;
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
      return false;
    }
    return true;
  }

  async handleClickedLinkAfterReload({request, newTab}) {
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
  }

  async handleNotClickedLink({request, tab, containerExists}) {
    if (tab.cookieStoreId !== 'firefox-default' && containerExists) {
      debug('[handleNotClickedLink] mac onBeforeRequest tab belongs to a non-default container', tab, request);
      this.automaticModeState.alreadySawThatLinkInNonDefault[request.url] = true;
      return;
    }

    if (tab.cookieStoreId === 'firefox-default'
        && this.automaticModeState.multiAccountConfirmPage[request.url]
        && this.automaticModeState.alreadySawThatLink[request.url] > 1) {
      debug('[handleNotClickedLink] default container and we saw a mac confirm page + link more than once already, i guess we can stop here');
      return false;
    }

    if (tab.cookieStoreId !== 'firefox-default' && containerExists) {
      debug('[handleNotClickedLink] onBeforeRequest tab belongs to a non-default container', tab, request,
        JSON.stringify(this.automaticModeState.multiAccountConfirmPage), JSON.stringify(this.automaticModeState.alreadySawThatLink));
      if (this.automaticModeState.multiAccountConfirmPage[request.url]) {
        debug('[handleNotClickedLink] we saw a multi account confirm page for that url', request.url);
        delete this.automaticModeState.multiAccountConfirmPage[request.url];
        return false;
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
      return false;
    }

    if (this.automaticModeState.multiAccountRemovedTab[request.url] > 1 &&
        !this.automaticModeState.multiAccountConfirmPage[request.url]) {
      debug('[handleNotClickedLink] multi-account-containers already removed a tab before, stop now',
        tab, request, JSON.stringify(this.automaticModeState));
      delete this.automaticModeState.multiAccountRemovedTab[request.url];
      return false;
    }

    return true;
  }

  cleanupAutomaticModeState(url) {
    delete this.automaticModeState.linkClickCreatedTabs[url];
    delete this.automaticModeState.alreadySawThatLink[url];
    delete this.automaticModeState.alreadySawThatLinkTotal[url];
    delete this.automaticModeState.alreadySawThatLinkInNonDefault[url];
    delete this.automaticModeState.multiAccountConfirmPage[url];
    delete this.automaticModeState.multiAccountConfirmPageTabs[url];
    delete this.automaticModeState.multiAccountWasFaster[url];
    delete this.automaticModeState.multiAccountRemovedTab[url];
  }
}

module.exports = MultiAccountContainers;
