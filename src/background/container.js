class Container {
  constructor(background) {
    this.background = background;
    this.containerColors = [
      'blue',      // #37ADFF
      'turquoise', // #00C79A
      'green',     // #51CD00
      'yellow',    // #FFCB00
      'orange',    // #FF9F00
      'red',       // #FF613D
      'pink',      // #FF4BDA
      'purple',    // #AF51F5
      'toolbar',
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
      'fence',
    ];

    this.tabContainerMap = {};
    this.urlCreatedContainer = {};
    this.requestCreatedTab = {};
    this.tabCreatedAsMacConfirmPage = {};
    this.removingContainerQueue = false;
    this.removeContainerFetchMassRemoval = {
      regular: [],
      deletesHistory: []
    };
    this.removeContainerQueue = new PQueue({concurrency: 1});
    this.removeContainerDelayQueue = new PQueue();
    this.removeContainerQueueMaybeDone = this.removeContainerQueueMaybeDone.bind(this);
    this.noContainerTabs = {};
  }


  initialize() {
    this.storage = this.background.storage;
    this.request = this.background.request;
    this.mouseclick = this.background.mouseclick;
    this.permissions = this.background.permissions;
    this.tabs = this.background.tabs;
    this.statistics = this.background.statistics;

    setInterval(() => {
      debug('[interval] container removal interval');
      this.cleanup();
    }, 600000);
  }


  async createTabInTempContainer({
    tab,
    url,
    active,
    request = false,
    dontPin = true,
    deletesHistory = false,
    macConfirmPage = false
  }) {
    if (request && request.requestId) {
      // we saw that request already
      if (this.requestCreatedTab[request.requestId]) {
        debug('[createTabInTempContainer] we already created a tab for this request, so we stop here, probably redirect', tab, request);
        return;
      }
      this.requestCreatedTab[request.requestId] = true;
      // cleanup tracked requests later
      // requestIds are unique per session, so we have no pressure to remove them
      delay(300000).then(() => {
        debug('[createTabInTempContainer] cleanup timeout', request);
        delete this.requestCreatedTab[request.requestId];
      });
    }

    const containerOptions = this.getContainerNameIconColor((request && request.url) || url);
    this.storage.local.tempContainersNumbers.push(containerOptions.number);

    if (!deletesHistory) {
      deletesHistory = this.mouseclick.shouldOpenDeletesHistoryContainer(url);
    }
    if (deletesHistory) {
      if (this.permissions.history) {
        containerOptions.name += '-deletes-history';
      } else {
        deletesHistory = false;
      }
    }
    containerOptions.deletesHistory = deletesHistory;

    try {
      debug('[createTabInTempContainer] creating new container', containerOptions);
      const contextualIdentity = await browser.contextualIdentities.create({
        name: containerOptions.name,
        icon: containerOptions.icon,
        color: containerOptions.color
      });
      debug('[createTabInTempContainer] contextualIdentity created', contextualIdentity);

      this.storage.local.tempContainers[contextualIdentity.cookieStoreId] = containerOptions;
      await this.storage.persist();

      try {
        const newTabOptions = {
          url,
          cookieStoreId: contextualIdentity.cookieStoreId,
        };
        if (tab) {
          newTabOptions.active = tab.active;
          if (tab.index >= 0) {
            newTabOptions.index = tab.index + 1;
          }
          if (tab.pinned && !dontPin) {
            newTabOptions.pinned = true;
          }
          if (tab.openerTabId) {
            newTabOptions.openerTabId = tab.openerTabId;
          }
        }
        if (active === false) {
          newTabOptions.active = false;
        }

        debug('[createTabInTempContainer] creating tab in temporary container', newTabOptions);
        const newTab = await browser.tabs.create(newTabOptions);
        debug('[createTabInTempContainer] new tab in temp container created', newTab);
        if (url) {
          this.urlCreatedContainer[url] = contextualIdentity.cookieStoreId;
          delay(1000).then(() => {
            debug('[createTabInTempContainer] cleaning up urlCreatedContainer', url);
            delete this.urlCreatedContainer[url];
          });
        }
        this.tabContainerMap[newTab.id] = contextualIdentity.cookieStoreId;
        if (macConfirmPage) {
          this.tabCreatedAsMacConfirmPage[newTab.id] = true;
        }
        await this.storage.persist();

        return newTab;
      } catch (error) {
        debug('[createTabInTempContainer] error while creating new tab', error);
      }
    } catch (error) {
      debug('[createTabInTempContainer] error while creating container', containerOptions.name, error);
    }
  }


  async reloadTabInTempContainer({
    tab,
    url,
    active,
    deletesHistory,
    request,
    macConfirmPage,
    dontPin = true
  }) {
    const newTab = await this.createTabInTempContainer({
      tab,
      url,
      active,
      dontPin,
      deletesHistory,
      request,
      macConfirmPage
    });
    if (!tab) {
      return newTab;
    }
    await this.tabs.remove(tab);
    return newTab;
  }


  getContainerNameIconColor(url) {
    let tempContainerNumber;
    if (this.storage.local.preferences.container.numberMode === 'keep') {
      this.storage.local.tempContainerCounter++;
      tempContainerNumber = this.storage.local.tempContainerCounter;
    }
    if (this.storage.local.preferences.container.numberMode === 'reuse') {
      tempContainerNumber = this.getReusedContainerNumber();
    }
    let containerName = this.storage.local.preferences.container.namePrefix;
    if (url) {
      const parsedUrl = new URL(url);
      if (containerName.includes('%fulldomain%')) {
        containerName = containerName.replace('%fulldomain%', parsedUrl.hostname);
      }
      if (containerName.includes('%domain%')) {
        const domain = psl.isValid(parsedUrl.hostname) ? psl.get(parsedUrl.hostname) : parsedUrl.hostname;
        containerName = containerName.replace('%domain%', domain);
      }

    } else {
      containerName = containerName
        .replace('%fulldomain%', '')
        .replace('%domain%', '');
    }
    containerName = `${containerName}${tempContainerNumber}`;

    let containerColor = this.storage.local.preferences.container.color;
    if (this.storage.local.preferences.container.colorRandom) {
      const containerColors = this.getAvailableContainerColors();
      containerColor = containerColors[Math.floor(Math.random() * containerColors.length)];
    }
    let containerIcon = this.storage.local.preferences.container.icon;
    if (this.storage.local.preferences.container.iconRandom) {
      containerIcon = this.containerIcons[Math.floor(Math.random() * this.containerIcons.length)];
    }
    return {
      name: containerName,
      color: containerColor,
      icon: containerIcon,
      number: tempContainerNumber,
      clean: true
    };
  }


  async addToRemoveQueue(tabId) {
    if (!this.tabContainerMap[tabId]) {
      debug('[addToRemoveQueue] removed tab that isnt in the tabContainerMap', tabId, this.tabContainerMap);
      return;
    }
    const cookieStoreId = this.tabContainerMap[tabId];
    if (!this.storage.local.tempContainers[cookieStoreId]) {
      debug('[addToRemoveQueue] container from the tabContainerMap is unknown', tabId, cookieStoreId);
      return;
    }
    const containerType = this.storage.local.tempContainers[cookieStoreId].deletesHistory ? 'deletesHistory' : 'regular';
    const containerRemoval = containerType === 'deletesHistory' ?
      this.storage.local.preferences.deletesHistory.containerRemoval :
      this.storage.local.preferences.container.removal;
    debug('[addToRemoveQueue] queuing container removal because of tab removal', cookieStoreId, tabId);
    this.removeContainerFetchMassRemoval[containerType].push(cookieStoreId);
    if (this.removeContainerFetchMassRemoval[containerType].length > 1) {
      return;
    }
    debug('[addToRemoveQueue] registering fetch mass removal delay', containerType, this.removeContainerFetchMassRemoval[containerType]);
    this.removingContainerQueue = true;
    await delay(15000);

    const queue = this.removeContainerFetchMassRemoval[containerType].splice(0);
    switch (containerRemoval) {
    case 'instant':
      debug('[addToRemoveQueue] trying to instant remove queue', containerType, queue);
      this.removeContainerQueue.add(() => this.tryToRemoveQueue(queue))
        .then(this.removeContainerQueueMaybeDone);
      break;

    case '2minutes':
      this.delayedRemoveQueue(containerType, queue, 120000);
      break;

    case '5minutes':
      this.delayedRemoveQueue(containerType, queue, 300000);
      break;

    case '15minutes':
      this.delayedRemoveQueue(containerType, queue, 900000);
      break;

    default:
      debug('[addToRemoveQueue] this should never happen', containerRemoval);
      this.removeContainerQueueMaybeDone();
      break;
    }
  }


  async delayedRemoveQueue(containerType, queue, delayTime) {
    debug('[addToRemoveQueue] registering delay for queue removal', delayTime, containerType, queue);
    this.maybeShowNotification(`Queued ${queue.length} Temporary Containers for removal in ${delayTime/1000/60}minutes`);
    this.removeContainerDelayQueue.add(async () => {
      await delay(delayTime);
      debug('[addToRemoveQueue] trying to remove queue after timeout', delayTime, containerType, queue);
      this.removeContainerQueue.add(() => this.tryToRemoveQueue(queue))
        .then(this.removeContainerQueueMaybeDone);
    });
  }


  async tryToRemoveQueue(queue) {
    debug('[tryToRemoveQueue] removal queue', queue);
    for (let cookieStoreId of queue) {
      if (!this.storage.local.tempContainers[cookieStoreId]) {
        debug('[tryToRemoveQueue] unknown container, probably already removed', cookieStoreId);
        continue;
      }
      const containerRemoved = await this.tryToRemove(cookieStoreId);
      if (containerRemoved) {
        debug('[tryToRemoveQueue] container removed, waiting a bit', cookieStoreId);
        await delay(5000);
      }
    }
    this.statistics.finish();
  }


  maybeShowNotification(message) {
    if (this.storage.local.preferences.notifications &&
        this.permissions.notifications) {
      debug('[maybeShowNotification] showing notification');
      browser.notifications.create({
        type: 'basic',
        title: 'Temporary Containers',
        iconUrl: 'icons/page-w-32.svg',
        message
      });
    }
  }


  async tryToRemove(cookieStoreId) {
    if (await this.tabs.onlyIncognitoOrNone()) {
      debug('[tryToRemove] canceling, only incognito or no tabs');
      return false;
    }

    try {
      await browser.contextualIdentities.get(cookieStoreId);
    } catch (error) {
      debug('[tryToRemove] container not found, removing entry from storage', cookieStoreId, error);
      this.storage.local.tempContainersNumbers = this.storage.local.tempContainersNumbers.filter(number => {
        return this.storage.local.tempContainers[cookieStoreId].number !== number;
      });
      delete this.storage.local.tempContainers[cookieStoreId];
      await this.storage.persist();
      return false;
    }

    try {
      const tempTabs = await browser.tabs.query({
        cookieStoreId
      });
      if (tempTabs.length > 0) {
        debug('[tryToRemove] not removing container because it still has tabs', cookieStoreId, tempTabs.length);
        return false;
      }
      debug('[tryToRemove] no tabs in temp container anymore, deleting container', cookieStoreId);
    } catch (error) {
      debug('[tryToRemove] failed to query tabs', cookieStoreId, error);
      return false;
    }
    let cookies = [];
    try {
      cookies = await browser.cookies.getAll({storeId: cookieStoreId});
    } catch (error) {
      debug('[tryToRemove] couldnt get cookies', cookieStoreId, error);
    }
    const containerRemoved = await this.removeContainer(cookieStoreId);
    if (!containerRemoved) {
      return false;
    }
    const historyClearedCount = this.maybeClearHistory(cookieStoreId);
    this.statistics.update(historyClearedCount, cookies.length, cookieStoreId);
    this.storage.local.tempContainersNumbers = this.storage.local.tempContainersNumbers.filter(number => {
      return this.storage.local.tempContainers[cookieStoreId].number !== number;
    });
    delete this.storage.local.tempContainers[cookieStoreId];
    await this.storage.persist();
    return true;
  }


  removeContainerQueueMaybeDone() {
    debug('[removeContainerQueueMaybeDone] maybe queue is done',
      this.removeContainerQueue.size, this.removeContainerQueue.pending,
      this.removeContainerDelayQueue.size, this.removeContainerDelayQueue.pending);
    if (this.removeContainerQueue.size === 0 &&
        this.removeContainerQueue.pending === 0 &&
        this.removeContainerDelayQueue.size === 0 &&
        this.removeContainerDelayQueue.pending === 0) {
      debug('[removeContainerQueueMaybeDone] yep');
      this.removingContainerQueue = false;
    } else {
      debug('[removeContainerQueueMaybeDone] nope');
    }
  }


  async removeContainer(cookieStoreId) {
    try {
      const contextualIdentity = await browser.contextualIdentities.remove(cookieStoreId);
      if (!contextualIdentity) {
        debug('[tryToRemoveContainer] couldnt find container to remove, probably already removed', cookieStoreId);
      } else {
        debug('[tryToRemoveContainer] container removed', cookieStoreId);
      }
      Object.keys(this.tabContainerMap).map((tabId) => {
        if (this.tabContainerMap[tabId] === cookieStoreId) {
          delete this.tabContainerMap[tabId];
        }
      });
      return true;
    } catch (error) {
      debug('[tryToRemoveContainer] error while removing container', cookieStoreId, error);
      return false;
    }
  }


  async cleanup(browserStart) {
    if (this.removingContainerQueue && !browserStart) {
      debug('[cleanup] skipping because we currently removing a queue');
      return;
    }
    const containers = Object.keys(this.storage.local.tempContainers);
    if (!containers.length) {
      debug('[cleanup] canceling, no containers at all');
      return;
    }
    if (await this.tabs.onlyIncognitoOrNone()) {
      debug('[cleanup] canceling, only incognito or no tabs');
      return;
    }

    this.removingContainerQueue = true;
    this.removeContainerQueue.add(() => this.tryToRemoveQueue(containers))
      .then(this.removeContainerQueueMaybeDone);
  }


  async maybeAddHistory(tab, url) {
    if (!tab || url === 'about:blank' || url === 'about:newtab') {
      return;
    }
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
    if (this.storage.local.tempContainers[cookieStoreId] &&
        this.storage.local.tempContainers[cookieStoreId].deletesHistory &&
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


  isPermanent(cookieStoreId) {
    if (cookieStoreId !== 'firefox-default' && !this.storage.local.tempContainers[cookieStoreId]) {
      return true;
    }
    return false;
  }


  isTemporary(cookieStoreId, type) {
    return !!(this.storage.local.tempContainers[cookieStoreId] &&
              (!type || this.storage.local.tempContainers[cookieStoreId][type]));
  }


  async convertTempContainerToPermanent({cookieStoreId, tabId, name, url}) {
    delete this.storage.local.tempContainers[cookieStoreId];
    await this.storage.persist();
    await browser.contextualIdentities.update(cookieStoreId, {
      name,
      color: 'blue'
    });
    await browser.tabs.create({
      cookieStoreId,
      url
    });
    await this.tabs.remove({id: tabId});
  }


  async convertTempContainerToRegular({cookieStoreId, tabId, url}) {
    this.storage.local.tempContainers[cookieStoreId].deletesHistory = false;
    delete this.storage.local.tempContainers[cookieStoreId].history;
    await this.storage.persist();
    const name = this.storage.local.tempContainers[cookieStoreId].name.replace('-deletes-history', '');
    await browser.contextualIdentities.update(cookieStoreId, {name});
    await browser.tabs.create({
      cookieStoreId,
      url
    });
    await this.tabs.remove({id: tabId});
  }


  async convertPermanentToTempContainer({cookieStoreId, tabId, url}) {
    const containerOptions = this.getContainerNameIconColor();
    await browser.contextualIdentities.update(
      cookieStoreId, {
        name: containerOptions.name,
        icon: containerOptions.icon,
        color: containerOptions.color
      }
    );
    this.storage.local.tempContainers[cookieStoreId] = containerOptions;
    await this.storage.persist();
    await browser.tabs.create({
      cookieStoreId,
      url
    });
    await this.tabs.remove({id: tabId});
  }


  isClean(cookieStoreId) {
    return this.storage.local.tempContainers[cookieStoreId] &&
      this.storage.local.tempContainers[cookieStoreId].clean;
  }


  markUnclean(tabId) {
    const cookieStoreId = this.tabContainerMap[tabId];
    if (cookieStoreId && this.isClean(cookieStoreId)) {
      debug('[markUnclean] marking tmp container as not clean anymore', cookieStoreId);
      this.storage.local.tempContainers[cookieStoreId].clean = false;
    }
  }


  markClean(tabId) {
    const cookieStoreId = this.tabContainerMap[tabId];
    if (cookieStoreId && !this.isClean(cookieStoreId)) {
      debug('[markClean] marking tmp container as clean', cookieStoreId);
      this.storage.local.tempContainers[cookieStoreId].clean = true;
    }
  }


  getReusedContainerNumber() {
    const tempContainersNumbers = this.storage.local.tempContainersNumbers.sort();
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

window.Container = Container;
