class Container {
  constructor(background) {
    this.background = background;
    this.containerColors = [
      'blue', // #37ADFF
      'turquoise', // #00C79A
      'green', // #51CD00
      'yellow', // #FFCB00
      'orange', // #FF9F00
      'red', // #FF613D
      'pink', // #FF4BDA
      'purple', // #AF51F5
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

    this.tabContainerMap = {};
    this.urlCreatedContainer = {};
    this.requestCreatedTab = {};
    this.tabCreatedAsMacConfirmPage = {};
    this.noContainerTabs = {};
    this.lastCreatedInactiveTab = {};
  }

  async initialize() {
    this.pref = this.background.pref;
    this.storage = this.background.storage;
    this.request = this.background.request;
    this.mouseclick = this.background.mouseclick;
    this.permissions = this.background.permissions;
    this.tabs = this.background.tabs;

    if (this.background.browserVersion >= 67) {
      this.containerColors.push('toolbar');
      this.containerIcons.push('fence');
    }
  }

  async createTabInTempContainer({
    tab,
    url,
    active,
    request = false,
    dontPin = true,
    deletesHistory = false,
    macConfirmPage = false,
  }) {
    if (request && request.requestId) {
      // we saw that request already
      if (this.requestCreatedTab[request.requestId]) {
        debug(
          '[createTabInTempContainer] we already created a tab for this request, so we stop here, probably redirect',
          tab,
          request
        );
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

    const contextualIdentity = await this.createTempContainer({
      url,
      request,
      deletesHistory,
    });

    return this.createTab({
      url,
      tab,
      active,
      dontPin,
      macConfirmPage,
      contextualIdentity,
    });
  }

  async createTempContainer({ url, request, deletesHistory }) {
    const containerOptions = this.generateContainerNameIconColor(
      (request && request.url) || url
    );

    if (containerOptions.number) {
      this.storage.local.tempContainersNumbers.push(containerOptions.number);
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
      debug(
        '[createTabInTempContainer] creating new container',
        containerOptions
      );
      const contextualIdentity = await browser.contextualIdentities.create({
        name: containerOptions.name,
        icon: containerOptions.icon,
        color: containerOptions.color,
      });
      debug(
        '[createTabInTempContainer] contextualIdentity created',
        contextualIdentity
      );

      this.storage.local.tempContainers[
        contextualIdentity.cookieStoreId
      ] = containerOptions;
      await this.storage.persist();

      return contextualIdentity;
    } catch (error) {
      debug(
        '[createTabInTempContainer] error while creating container',
        containerOptions.name,
        error
      );
    }
  }

  async createTab({
    url,
    tab,
    active,
    dontPin,
    macConfirmPage,
    contextualIdentity,
  }) {
    try {
      const newTabOptions = {
        url,
        cookieStoreId: contextualIdentity.cookieStoreId,
      };
      if (tab) {
        newTabOptions.active = tab.active;
        if (tab.index >= 0) {
          if (
            !tab.active &&
            this.lastCreatedInactiveTab[browser.windows.WINDOW_ID_CURRENT]
          ) {
            debug(
              '[createTabInTempContainer] lastCreatedInactiveTab id',
              this.lastCreatedInactiveTab
            );
            try {
              const lastCreatedInactiveTab = await browser.tabs.get(
                this.lastCreatedInactiveTab[browser.windows.WINDOW_ID_CURRENT]
              );
              debug(
                '[createTabInTempContainer] lastCreatedInactiveTab',
                lastCreatedInactiveTab
              );
              newTabOptions.index = lastCreatedInactiveTab.index + 1;
            } catch (error) {
              debug(
                '[createTabInTempContainer] failed to get lastCreatedInactiveTab',
                error
              );
              newTabOptions.index = tab.index + 1;
            }
          } else {
            newTabOptions.index = tab.index + 1;
          }
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

      debug(
        '[createTabInTempContainer] creating tab in temporary container',
        newTabOptions
      );
      const newTab = await browser.tabs.create(newTabOptions);
      if (tab && !tab.active) {
        this.lastCreatedInactiveTab[browser.windows.WINDOW_ID_CURRENT] =
          newTab.id;
      }
      debug(
        '[createTabInTempContainer] new tab in temp container created',
        newTab
      );
      if (url) {
        this.urlCreatedContainer[url] = contextualIdentity.cookieStoreId;
        delay(1000).then(() => {
          debug(
            '[createTabInTempContainer] cleaning up urlCreatedContainer',
            url
          );
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
  }

  async reloadTabInTempContainer({
    tab,
    url,
    active,
    deletesHistory,
    request,
    macConfirmPage,
    dontPin = true,
  }) {
    const newTab = await this.createTabInTempContainer({
      tab,
      url,
      active,
      dontPin,
      deletesHistory,
      request,
      macConfirmPage,
    });
    if (!tab) {
      return newTab;
    }
    await this.tabs.remove(tab);
    return newTab;
  }

  generateContainerNameIconColor(url) {
    let tempContainerNumber = '';
    if (this.pref.container.numberMode.startsWith('keep')) {
      this.storage.local.tempContainerCounter++;
      tempContainerNumber = this.storage.local.tempContainerCounter;
    }
    if (this.pref.container.numberMode === 'reuse') {
      tempContainerNumber = this.getReusedContainerNumber();
    }
    let containerName = this.pref.container.namePrefix;
    if (url) {
      const parsedUrl = new URL(url);
      if (containerName.includes('%fulldomain%')) {
        containerName = containerName.replace(
          '%fulldomain%',
          parsedUrl.hostname
        );
      }
      if (containerName.includes('%domain%')) {
        const domain = psl.isValid(parsedUrl.hostname)
          ? psl.get(parsedUrl.hostname)
          : parsedUrl.hostname;
        containerName = containerName.replace('%domain%', domain);
      }
    } else {
      containerName = containerName
        .replace('%fulldomain%', '')
        .replace('%domain%', '');
    }
    containerName = `${containerName}${tempContainerNumber}`;
    if (!containerName) {
      containerName = ' ';
    }

    let containerColor = this.pref.container.color;
    if (this.pref.container.colorRandom) {
      const containerColors = this.getAvailableContainerColors();
      containerColor =
        containerColors[Math.floor(Math.random() * containerColors.length)];
    }
    let containerIcon = this.pref.container.icon;
    if (this.pref.container.iconRandom) {
      let containerIcons = this.containerIcons.filter(
        icon => !this.pref.container.iconRandomExcluded.includes(icon)
      );
      if (!containerIcons.length) {
        containerIcons = this.containerIcons;
      }
      containerIcon =
        containerIcons[Math.floor(Math.random() * containerIcons.length)];
    }
    return {
      name: containerName,
      color: containerColor,
      icon: containerIcon,
      number: tempContainerNumber,
      clean: true,
    };
  }

  isPermanent(cookieStoreId) {
    if (
      cookieStoreId !== `${this.background.containerPrefix}-default` &&
      !this.storage.local.tempContainers[cookieStoreId]
    ) {
      return true;
    }
    return false;
  }

  isTemporary(cookieStoreId, type) {
    return !!(
      this.storage.local.tempContainers[cookieStoreId] &&
      (!type || this.storage.local.tempContainers[cookieStoreId][type])
    );
  }

  isClean(cookieStoreId) {
    return (
      this.storage.local.tempContainers[cookieStoreId] &&
      this.storage.local.tempContainers[cookieStoreId].clean
    );
  }

  markUnclean(tabId) {
    const cookieStoreId = this.tabContainerMap[tabId];
    if (cookieStoreId && this.isClean(cookieStoreId)) {
      debug(
        '[markUnclean] marking tmp container as not clean anymore',
        cookieStoreId
      );
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
    let availableColors = [];
    const containersOptions = Object.values(this.storage.local.tempContainers);
    const assignedColors = {};
    let maxColors = 0;
    for (const containerOptions of containersOptions) {
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

    for (const color of this.containerColors) {
      if (this.pref.container.colorRandomExcluded.includes(color)) {
        continue;
      }
      if (!assignedColors[color] || assignedColors[color] < maxColors) {
        availableColors.push(color);
      }
    }

    if (!availableColors.length) {
      availableColors = this.containerColors.filter(
        color => !this.pref.container.colorRandomExcluded.includes(color)
      );
      if (!availableColors.length) {
        availableColors = this.containerColors;
      }
    }

    return availableColors;
  }
}

export default Container;
