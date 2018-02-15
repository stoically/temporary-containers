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

    this.urlCreatedContainer = {};
    this.requestCreatedTab = {};
    this.creatingTabInSameContainer = false;
    this.removeContainerQueue = [];
    this.removedContainerCount = 0;
    this.removedContainerCookiesCount = 0;
    this.removedContainerHistoryCount = 0;
  }


  initialize(background) {
    this.background = background;
    this.storage = background.storage;
    this.request = background.request;
    this.mouseclick = background.mouseclick;

    browser.cookies.onChanged.addListener(this.cookieCount.bind(this));

    setInterval(() => {
      debug('[interval] container removal interval', this.storage.local.tempContainers);
      if (this.removeContainerQueue.length) {
        debug('[interval] skipping because theres something in the queue');
        return;
      }
      this.cleanup();
    }, 60000);
  }


  async createTabInTempContainer({
    tab,
    url,
    request = false,
    alwaysOpenIn = false,
    active = false,
    dontPin = true,
    deletesHistory = false
  }) {
    if (request && request.requestId) {
      // we saw that request already
      if (this.requestCreatedTab[request.requestId]) {
        debug('[createTabInTempContainer] we already created a tab for this request, so we stop here, probably redirect', tab, request);
        return;
      }
      this.requestCreatedTab[request.requestId] = true;
      // cleanup tracked requests later
      setTimeout(() => {
        debug('[createTabInTempContainer] cleanup timeout', request);
        delete this.requestCreatedTab[request.requestId];
      }, 2000);
    }

    let tempContainerNumber;
    if (this.storage.local.preferences.containerNumberMode === 'keep') {
      this.storage.local.tempContainerCounter++;
      tempContainerNumber = this.storage.local.tempContainerCounter;
    }
    if (this.storage.local.preferences.containerNumberMode === 'reuse') {
      tempContainerNumber = this.getReusedContainerNumber();
    }
    let containerName = `${this.storage.local.preferences.containerNamePrefix}${tempContainerNumber}`;

    if (!deletesHistory) {
      deletesHistory = this.mouseclick.shouldOpenDeletesHistoryContainer(url);
    }
    if (deletesHistory) {
      if (this.background.permissions.history) {
        containerName += '-deletes-history';
      } else {
        deletesHistory = false;
      }
    }
    try {
      let containerColor = this.storage.local.preferences.containerColor;
      if (this.storage.local.preferences.containerColorRandom) {
        const containerColors = this.getAvailableContainerColors();
        containerColor = containerColors[Math.floor(Math.random() * containerColors.length)];
      }
      let containerIcon = this.storage.local.preferences.containerIcon;
      if (this.storage.local.preferences.containerIconRandom) {
        containerIcon = this.containerIcons[Math.floor(Math.random() * this.containerIcons.length)];
      }
      const containerOptions = {
        name: containerName,
        color: containerColor,
        icon: containerIcon
      };
      debug('[createTabInTempContainer] creating new container', containerOptions);
      const contextualIdentity = await browser.contextualIdentities.create(containerOptions);
      debug('[createTabInTempContainer] contextualIdentity created', contextualIdentity);
      containerOptions.number = tempContainerNumber;
      containerOptions.deletesHistory = deletesHistory;
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
          this.urlCreatedContainer[url] = contextualIdentity.cookieStoreId;
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


  async reloadTabInTempContainer(tab, url, active, deletesHistory, request) {
    const newTab = await this.createTabInTempContainer({tab, url, active, deletesHistory, request});
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

    if (this.creatingTabInSameContainer) {
      debug('[maybeReloadTabInTempContainer] were in the process of creating a tab in same container, ignore');
      return;
    }

    if (tab.url.startsWith('moz-extension://')) {
      debug('[maybeReloadTabInTempContainer] moz-extension:// tab, do something special', tab);
      await this.background.emit('handleMultiAccountContainersConfirmPage', tab);
      return;
    }

    if (!this.storage.local.preferences.automaticMode) {
      debug('[maybeReloadTabInTempContainer] automatic mode not active and not a moz page, we ignore that', tab);
      return;
    }

    const deletesHistoryContainer = this.storage.local.preferences.deletesHistoryContainer === 'automatic';

    if (!deletesHistoryContainer &&
        this.storage.local.preferences.automaticModeNewTab === 'navigation' &&
        tab.cookieStoreId === 'firefox-default' &&
       (tab.url === 'about:home' ||
        tab.url === 'about:newtab')) {
      debug('[maybeReloadTabInTempContainer] automatic mode on navigation, setting icon badge', tab);
      this.addBrowserActionBadge(tab.id);
      return;
    }

    if ((this.storage.local.preferences.automaticModeNewTab === 'created' || deletesHistoryContainer) &&
        tab.cookieStoreId === 'firefox-default' &&
       (tab.url === 'about:home' ||
        tab.url === 'about:newtab')) {
      debug('[maybeReloadTabInTempContainer] about:home/new tab in firefox-default container, reload in temp container', tab);

      await this.reloadTabInTempContainer(tab, null, null, deletesHistoryContainer);
      return;
    }

    debug('[maybeReloadTabInTempContainer] not a home/new/moz tab or disabled, we dont handle that', tab);
  }

  addToRemoveQueue(tabId) {
    if (!this.storage.local.tabContainerMap[tabId]) {
      debug('[addToRemoveQueue] removed tab that isnt in the tabContainerMap', tabId, this.storage.local.tabContainerMap);
      return;
    }
    const cookieStoreId = this.storage.local.tabContainerMap[tabId];
    debug('[addToRemoveQueue] queuing container removal because of tab removal', cookieStoreId, tabId);
    this.removeContainerQueue.push(cookieStoreId);
    if (this.removeContainerQueue.length === 1) {
      this.removedContainerCount = 1;
      this.removedContainerCookiesCount = 0;
      this.removedContainerHistoryCount = 0;
      debug('[addToRemoveQueue] registering tryToRemoveQueue timeout', this.removeContainerQueue);
      setTimeout(() => {
        this.tryToRemoveQueue();
      }, 1000);
    } else {
      this.removedContainerCount++;
    }
  }

  async tryToRemoveQueue() {
    const removeContainers = this.removeContainerQueue.splice(0, 3);
    for (let cookieStoreId of removeContainers) {
      await this.tryToRemove.call(this, cookieStoreId);
    }

    if (this.removeContainerQueue.length) {
      debug('[tryToRemoveQueue] more then 3 containers removed, requeuing', this.removeContainerQueue);
      setTimeout(() => {
        this.tryToRemoveQueue();
      }, 8000);
    } else {
      debug('[tryToRemoveQueue] queue cleared', this.storage.local.preferences.notifications);
      if (this.storage.local.preferences.notifications && this.background.permissions.notifications) {
        debug('[tryToRemoveQueue] showing notification');
        let message = `Deleted Temporary Containers: ${this.removedContainerCount}`;
        if (this.removedContainerCookiesCount) {
          message += `\nand ${this.removedContainerCookiesCount} Cookies with them`;
        }
        if (this.removedContainerHistoryCount) {
          message += `\nand ${this.removedContainerHistoryCount} URLs from History with them`;
        }
        browser.notifications.create({
          type: 'basic',
          title: 'Temporary Containers',
          iconUrl: 'icons/page-w-32.svg',
          message
        });
      }
    }
  }

  async tryToRemove(cookieStoreId) {
    if (await this.onlyIncognitoOrNoTabs()) {
      debug('[tryToRemove] canceling, only incognito or no tabs');
      return;
    }

    try {
      const tempTabs = await browser.tabs.query({
        cookieStoreId
      });
      if (tempTabs.length > 0) {
        debug('[tryToRemove] not removing container because it still has tabs', cookieStoreId, tempTabs.length);
        return;
      }
      debug('[tryToRemove] no tabs in temp container anymore, deleting container', cookieStoreId);
    } catch (error) {
      debug('[tryToRemove] failed to query tabs', cookieStoreId, error);
      return;
    }
    this.removeContainer(cookieStoreId);
    const historyClearedCount = this.maybeClearHistory(cookieStoreId);
    if (historyClearedCount) {
      this.removedContainerHistoryCount += historyClearedCount;
    }
    if (this.storage.local.preferences.statistics) {
      this.storage.local.statistics.containersDeleted++;
    }

    if (this.storage.local.preferences.deletesHistoryStatistics &&
        this.storage.local.tempContainers[cookieStoreId].deletesHistory) {
      this.storage.local.statistics.deletesHistory.containersDeleted++;
      if (historyClearedCount) {
        this.storage.local.statistics.deletesHistory.urlsDeleted += historyClearedCount;
      }
      if (this.storage.local.tempContainers[cookieStoreId].cookieCount) {
        this.storage.local.statistics.deletesHistory.cookiesDeleted += this.storage.local.tempContainers[cookieStoreId].cookieCount;
      }
    }
    if (this.storage.local.tempContainers[cookieStoreId].cookieCount) {
      if (this.storage.local.preferences.statistics) {
        this.storage.local.statistics.cookiesDeleted += this.storage.local.tempContainers[cookieStoreId].cookieCount;
      }
      this.removedContainerCookiesCount += this.storage.local.tempContainers[cookieStoreId].cookieCount;
    }
    delete this.storage.local.tempContainers[cookieStoreId];
    await this.storage.persist();
  }


  async removeContainer(cookieStoreId) {
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
  }


  async cleanup() {
    if (await this.onlyIncognitoOrNoTabs()) {
      debug('[cleanup] canceling, only incognito or no tabs');
      return;
    }

    Object.keys(this.storage.local.tempContainers).map((cookieStoreId) => {
      this.tryToRemove(cookieStoreId);
    });
  }


  async onlyIncognitoOrNoTabs() {
    // don't do a cleanup if there are none or only incognito-tabs
    try {
      const tabs = await browser.tabs.query({});
      if (!tabs.length) {
        return true;
      }
      if (!tabs.filter(tab => !tab.incognito).length) {
        return true;
      }
      return false;
    } catch (error) {
      debug('[onlyIncognitoOrNoTabs] failed to query tabs', error);
      return false;
    }
  }


  async createTabInSameContainer() {
    this.creatingTabInSameContainer = true;
    try {
      const tabs = await browser.tabs.query({
        active: true,
        currentWindow: true
      });
      const activeTab = tabs[0];
      if (!activeTab) {
        debug('[createTabInSameContainer] couldnt find an active tab', activeTab);
        return;
      }
      try {
        const newTab = await browser.tabs.create({
          active: true,
          index: activeTab.index + 1,
          cookieStoreId: activeTab.cookieStoreId
        });
        this.creatingTabInSameContainer = false;
        debug('[createTabInSameContainer] new same container tab created', activeTab, newTab);
      } catch (error) {
        debug('[createTabInSameContainer] couldnt create tab', error);
        this.creatingTabInSameContainer = false;
      }
    } catch (error) {
      debug('[createTabInSameContainer] couldnt query tabs', error);
      this.creatingTabInSameContainer = false;
    }
  }


  async maybeAddHistory(tab, url) {
    if (tab.cookieStoreId !== 'firefox-default' &&
        this.storage.local.tempContainers[tab.cookieStoreId] &&
        this.storage.local.tempContainers[tab.cookieStoreId].deletesHistory) {
      if (!this.storage.local.tempContainers[tab.cookieStoreId].history) {
        this.storage.local.tempContainers[tab.cookieStoreId].history = {};
      }
      this.storage.local.tempContainers[tab.cookieStoreId].history[url] = {
        tabId: tab.id
      };
      await this.storage.persist();
    }
  }


  maybeClearHistory(cookieStoreId) {
    let count = 0;
    if (this.storage.local.tempContainers[cookieStoreId].deletesHistory &&
        this.storage.local.tempContainers[cookieStoreId].history) {
      const urls = Object.keys(this.storage.local.tempContainers[cookieStoreId].history);
      count = urls.length;
      urls.map(url => {
        if (!url) {
          return;
        }
        debug('[tryToRemoveContainer] removing url from history', url);
        browser.history.deleteUrl({url});
      });
    }
    return count;
  }


  addBrowserActionBadge(tabId) {
    browser.browserAction.setBadgeBackgroundColor({
      color: '#FF613D',
      tabId: tabId
    });
    browser.browserAction.setTitle({
      title: 'Automatic Mode active. The next website you navigate to will be reopened ' +
             'in a Temporay Container. Click to open a new Tab in a new Temporary Container (Alt+C)',
      tabId: tabId
    });
    browser.browserAction.setBadgeText({
      text: 'A',
      tabId: tabId
    });
  }


  async cookieCount(changeInfo) {
    if (!this.storage.local.preferences.statistics &&
        !this.storage.local.preferences.deletesHistoryStatistics &&
        !this.storage.local.preferences.notifications) {
      return;
    }
    debug('[cookieCount]', changeInfo);
    if (changeInfo.removed) {
      return;
    }
    if (!this.storage.local.tempContainers[changeInfo.cookie.storeId]) {
      return;
    }
    if (!this.storage.local.tempContainers[changeInfo.cookie.storeId].cookieCount) {
      this.storage.local.tempContainers[changeInfo.cookie.storeId].cookieCount = 0;
    }
    this.storage.local.tempContainers[changeInfo.cookie.storeId].cookieCount++;
    await this.storage.persist();
  }


  removeBrowserActionBadge(tabId) {
    browser.browserAction.setTitle({
      title: 'Open a new Tab in a new Temporary Container (Alt+C)',
      tabId
    });
    browser.browserAction.setBadgeText({
      text: '',
      tabId
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
