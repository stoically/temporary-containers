const { debug } = require('./log');

class Container {
  constructor() {
    this.containerColors = [
      'blue',
      'turquoise',
      'green',
      'yellow',
      'orange',
      'red',
      'pink',
      'purple',
    ];

    this.containerIcons = [
      'fingerprint',
      'briefcase',
      'dollar',
      'cart',
      'circle',
      'gift',
      'vacation',
      'food',
      'fruit',
      'pet',
      'tree',
      'chill',
    ];
  }


  initialize(background) {
    this.storage = background.storage;
    this.request = background.request;
    this.automaticModeState = background.automaticModeState;
  }


  async createTabInTempContainer(tab, url, alwaysOpenIn, active, dontPin) {
    let tempContainerNumber;
    if (this.storage.preferences.containerNumberMode === 'keep') {
      this.storage.local.tempContainerCounter++;
      tempContainerNumber = this.storage.local.tempContainerCounter;
    }
    if (this.storage.preferences.containerNumberMode === 'reuse') {
      tempContainerNumber = this.getReusedContainerNumber();
    }
    const containerName = `${this.storage.preferences.containerNamePrefix}${tempContainerNumber}`;
    try {
      let containerColor = this.storage.preferences.containerColor;
      if (this.storage.preferences.containerColorRandom) {
        const containerColors = this.getAvailableContainerColors();
        containerColor = containerColors[Math.floor(Math.random() * containerColors.length)];
      }
      let containerIcon = this.storage.preferences.containerIcon;
      if (this.storage.preferences.containerIconRandom) {
        containerIcon = this.containerIcons[Math.floor(Math.random() * this.containerIcons.length)];
      }
      const containerOptions = {
        name: containerName,
        color: containerColor,
        icon: containerIcon
      };
      const contextualIdentity = await browser.contextualIdentities.create(containerOptions);
      debug('[createTabInTempContainer] contextualIdentity created', contextualIdentity);
      containerOptions.number = tempContainerNumber;
      this.storage.local.tempContainers[contextualIdentity.cookieStoreId] = containerOptions;
      await this.storage.persist();

      try {
        const newTabActive = active || !url || alwaysOpenIn ? true : false;
        const newTabOptions = {
          url,
          active: newTabActive,
          cookieStoreId: contextualIdentity.cookieStoreId,
        };
        if (url && tab) {
          if (tab.index >= 0) {
            newTabOptions.index = tab.index + 1;
          }
          if (tab.pinned && !dontPin) {
            newTabOptions.pinned = true;
          }
        }

        debug('[createTabInTempContainer] creating tab in temporary container', newTabOptions);
        const newTab = await browser.tabs.create(newTabOptions);
        debug('[createTabInTempContainer] new tab in temp container created', newTab);
        if (url) {
          this.automaticModeState.linkCreatedContainer[url] = contextualIdentity.cookieStoreId;
        }
        this.storage.local.tabContainerMap[newTab.id] = contextualIdentity.cookieStoreId;
        await this.storage.persist();

        return newTab;
      } catch (error) {
        debug('[createTabInTempContainer] error while creating new tab', error);
      }
    } catch (error) {
      debug('[createTabInTempContainer] error while creating container', containerName, error);
    }
  }


  async reloadTabInTempContainer(tab, url, active) {
    const newTab = await this.createTabInTempContainer(tab, url, false, active);
    if (!tab) {
      return newTab;
    }
    await this.removeTab(tab);
    return newTab;
  }


  async removeTab(tab) {
    try {
      // make sure we dont close the window by removing this tab
      const tabs = await browser.tabs.query({windowId: browser.windows.WINDOW_ID_CURRENT});
      if (tabs.length > 1) {
        try {
          await browser.tabs.remove(tab.id);
          debug('[removeTab] removed old tab', tab.id);
        } catch (error) {
          debug('[removeTab] error while removing old tab', tab, error);
        }
      } else {
        debug('[removeTab] queuing removal of tab to prevent closing of window', tab, tabs);
        setTimeout(() => {
          this.removeTab(tab);
        }, 500);
      }
    } catch (error) {
      debug('[removeTab] couldnt query tabs', tab, error);
    }


  }


  async maybeReloadTabInTempContainer(tab) {
    if (tab.incognito) {
      debug('[maybeReloadTabInTempContainer] tab is incognito, ignore it and disable browseraction', tab);
      browser.browserAction.disable(tab.id);
      return;
    }

    if (tab.url.startsWith('moz-extension://')) {
      debug('[maybeReloadTabInTempContainer] moz-extension:// tab, do something special', tab);
      await this.handleMultiAccountContainersConfirmPage(tab);
      return;
    }

    if (!this.storage.preferences.automaticMode) {
      debug('[maybeReloadTabInTempContainer] automatic mode not active and not a moz page, we ignore that', tab);
      return;
    }

    if (tab.cookieStoreId === 'firefox-default' &&
       (tab.url === 'about:home' ||
        tab.url === 'about:newtab')) {
      debug('[maybeReloadTabInTempContainer] about:home/new tab in firefox-default container, reload in temp container', tab);
      await this.reloadTabInTempContainer(tab);
      return;
    }

    debug('[maybeReloadTabInTempContainer] not a home/new/moz tab, we dont handle that', tab);
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

      if (!this.storage.preferences.automaticMode &&
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
          this.automaticModeState.linkClicked[multiAccountTargetURL] &&
          this.automaticModeState.linkClicked[multiAccountTargetURL].tab &&
          multiAccountOriginContainer !== this.automaticModeState.linkClicked[multiAccountTargetURL].tab.cookieStoreId) {
        dontCloseThisMacConfirm = true;
      }
      // first MAC confirm for a not clicked link in a non-default container, we probably can leave this open
      if (tab.cookieStoreId !== 'firefox-default' &&
         !this.automaticModeState.linkClicked[multiAccountTargetURL] &&
         !this.automaticModeState.alreadySawThatLinkTotal[multiAccountTargetURL] &&
         !this.automaticModeState.multiAccountConfirmPage[multiAccountTargetURL] &&
         !this.automaticModeState.multiAccountRemovedTab[multiAccountTargetURL]) {
        dontCloseThisMacConfirm = true;
        this.automaticModeState.multiAccountConfirmPageTabs[multiAccountTargetURL].push(tab.id);
      } else {
        if (this.automaticModeState.multiAccountConfirmPageTabs[multiAccountTargetURL].length) {
          this.automaticModeState.multiAccountConfirmPageTabs[multiAccountTargetURL].map(tabId => {
            this.removeTab({id: tabId});
          });
        }
      }

      if (this.automaticModeState.linkCreatedContainer[multiAccountTargetURL] && multiAccountOriginContainer &&
          this.automaticModeState.linkCreatedContainer[multiAccountTargetURL] === multiAccountOriginContainer) {
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
          (multiAccountOriginContainer && this.automaticModeState.linkClicked[multiAccountTargetURL] &&
           this.automaticModeState.linkClicked[multiAccountTargetURL].containers[multiAccountOriginContainer] &&
           !this.automaticModeState.multiAccountConfirmPage[multiAccountTargetURL])
          ||
          (!multiAccountOriginContainer && tab.cookieStoreId === 'firefox-default')) {
        this.automaticModeState.multiAccountConfirmPage[multiAccountTargetURL]++;
        debug('[handleMultiAccountContainersConfirmPage] we can remove this tab, i guess - and yes this is a bit hacky', tab);
        await this.removeTab(tab);
        debug('[handleMultiAccountContainersConfirmPage] removed multi-account-containers tab', tab.id);
        return;
      } else {
        this.automaticModeState.multiAccountConfirmPage[multiAccountTargetURL]++;
      }
    }
  }


  async tryToRemove(cookieStoreId) {
    try {
      const tempTabs = await browser.tabs.query({
        cookieStoreId
      });
      if (tempTabs.length > 0) {
        debug('[tryToRemoveContainer] not removing container because it still has tabs', cookieStoreId, tempTabs.length);
        return;
      }
      debug('[tryToRemoveContainer] no tabs in temp container anymore, deleting container', cookieStoreId);
    } catch (error) {
      debug('[tryToRemoveContainer] failed to query tabs', cookieStoreId, error);
      return;
    }
    try {
      const contextualIdentity = await browser.contextualIdentities.remove(cookieStoreId);
      if (!contextualIdentity) {
        debug('[tryToRemoveContainer] couldnt find container to remove', cookieStoreId);
      } else {
        debug('[tryToRemoveContainer] container removed', cookieStoreId);
      }
      Object.keys(this.storage.local.tabContainerMap).map((tabId) => {
        if (this.storage.local.tabContainerMap[tabId] === cookieStoreId) {
          delete this.storage.local.tabContainerMap[tabId];
        }
      });
    } catch (error) {
      debug('[tryToRemoveContainer] error while removing container', cookieStoreId, error);
    }
    delete this.storage.local.tempContainers[cookieStoreId];
    await this.storage.persist();
  }


  cleanup() {
    Object.keys(this.storage.local.tempContainers).map((cookieStoreId) => {
      this.tryToRemove(cookieStoreId);
    });
  }


  getReusedContainerNumber() {
    const tempContainersNumbers = Object.values(this.storage.local.tempContainers)
      .reduce((accumulator, containerOptions) => {
        if (typeof containerOptions !== 'object') {
          accumulator.push(containerOptions);
          return accumulator;
        }
        accumulator.push(containerOptions.number);
        return accumulator;
      }, [])
      .sort();
    if (!tempContainersNumbers.length) {
      return 1;
    } else {
      const maxContainerNumber = Math.max.apply(Math, tempContainersNumbers);
      for (let i = 1; i < maxContainerNumber; i++) {
        if (!tempContainersNumbers.includes(i)) {
          return i;
        }
      }
      return maxContainerNumber + 1;
    }
  }


  getAvailableContainerColors() {
    // even out colors
    const availableColors = [];
    const containersOptions = Object.values(this.storage.local.tempContainers);
    const assignedColors = {};
    let maxColors = 0;
    for (let containerOptions of containersOptions) {
      if (typeof containerOptions !== 'object') {
        continue;
      }
      if (!assignedColors[containerOptions.color]) {
        assignedColors[containerOptions.color] = 0;
      }
      assignedColors[containerOptions.color]++;
      if (assignedColors[containerOptions.color] > maxColors) {
        maxColors = assignedColors[containerOptions.color];
      }
    }

    for (let color of this.containerColors) {
      if (!assignedColors[color] || assignedColors[color] < maxColors) {
        availableColors.push(color);
      }
    }

    return availableColors.length ? availableColors : this.containerColors;
  }
}

module.exports = Container;
