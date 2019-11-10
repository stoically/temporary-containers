import { IPermissions, TemporaryContainers } from '../background';
import { delay, psl } from './lib';
import { debug } from './log';
import { IPreferences } from './preferences';
import { Storage } from './storage';
import { TabId, Tabs } from './tabs';

export type CookieStoreId = string;

const CONTAINER_COLORS = [
  'blue', // #37ADFF
  'turquoise', // #00C79A
  'green', // #51CD00
  'yellow', // #FFCB00
  'orange', // #FF9F00
  'red', // #FF613D
  'pink', // #FF4BDA
  'purple', // #AF51F5
  'toolbar',
];
export type ContainerColor = typeof CONTAINER_COLORS[number];

const CONTAINER_ICONS = [
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
export type ContainerIcon = typeof CONTAINER_ICONS[number];

export interface IContainerOptions {
  name: string;
  color: ContainerColor;
  icon: ContainerIcon;
  number: number;
  clean: boolean;
  deletesHistory?: boolean;
  history?: {
    [key: string]: { tabId: TabId };
  };
}

export class Container {
  public noContainerTabs: {
    [key: number]: boolean;
  } = {};
  public urlCreatedContainer: {
    [key: string]: CookieStoreId;
  } = {};
  public tabCreatedAsMacConfirmPage: {
    [key: number]: boolean;
  } = {};
  public lastCreatedInactiveTab: {
    [key: number]: TabId;
  } = {};

  private containerColors: ContainerColor[] = CONTAINER_COLORS;
  private containerIcons: ContainerIcon[] = CONTAINER_ICONS;
  private requestCreatedTab: {
    [key: number]: boolean;
  } = {};

  private background: TemporaryContainers;
  private pref!: IPreferences;
  private storage!: Storage;
  private permissions!: IPermissions;
  private tabs!: Tabs;

  constructor(background: TemporaryContainers) {
    this.background = background;
  }

  public async initialize() {
    this.pref = this.background.pref;
    this.storage = this.background.storage;
    this.permissions = this.background.permissions;
    this.tabs = this.background.tabs;

    if (this.background.browserVersion >= 67) {
      this.containerColors.push('toolbar');
      this.containerIcons.push('fence');
    }
  }

  public async createTabInTempContainer({
    tab,
    url,
    active,
    request = false,
    dontPin = true,
    deletesHistory = false,
    macConfirmPage = false,
  }: {
    tab?: browser.tabs.Tab;
    url?: string;
    active?: boolean;
    request?: any;
    dontPin?: boolean;
    deletesHistory?: boolean;
    macConfirmPage?: boolean;
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

    return contextualIdentity
      ? this.createTab({
          url,
          tab,
          active,
          dontPin,
          macConfirmPage,
          contextualIdentity,
        })
      : false;
  }

  public async createTempContainer({
    url,
    request,
    deletesHistory,
  }: {
    url?: string;
    request?: any;
    deletesHistory?: boolean;
  }) {
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

  public async createTab({
    url,
    tab,
    active,
    dontPin,
    macConfirmPage,
    contextualIdentity,
  }: {
    url?: string;
    tab?: browser.tabs.Tab;
    active?: boolean;
    dontPin?: boolean;
    macConfirmPage?: boolean;
    contextualIdentity: browser.contextualIdentities.ContextualIdentity;
  }) {
    interface ITabOptions {
      cookieStoreId: CookieStoreId;
      url?: string;
      active?: boolean;
      index?: number;
      pinned?: boolean;
      openerTabId?: number;
    }

    try {
      const newTabOptions: ITabOptions = {
        cookieStoreId: contextualIdentity.cookieStoreId,
        url,
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
        this.lastCreatedInactiveTab[
          browser.windows.WINDOW_ID_CURRENT
        ] = newTab.id!;
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
      this.tabs.containerMap.set(newTab.id, contextualIdentity.cookieStoreId);
      if (macConfirmPage) {
        this.tabCreatedAsMacConfirmPage[newTab.id!] = true;
      }
      await this.storage.persist();

      return newTab;
    } catch (error) {
      debug('[createTabInTempContainer] error while creating new tab', error);
    }
  }

  public async reloadTabInTempContainer({
    tab,
    url,
    active,
    deletesHistory,
    request,
    macConfirmPage,
    dontPin = true,
  }: {
    tab?: browser.tabs.Tab;
    url?: string;
    active?: boolean;
    deletesHistory?: boolean;
    request?: any;
    macConfirmPage?: boolean;
    dontPin?: boolean;
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

  public generateContainerNameIconColor(url?: string): IContainerOptions {
    let tempContainerNumber = 0;
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
        if (domain) {
          containerName = containerName.replace('%domain%', domain);
        }
      }
    } else {
      containerName = containerName
        .replace('%fulldomain%', '')
        .replace('%domain%', '');
    }
    if (tempContainerNumber) {
      containerName = `${containerName}${tempContainerNumber}`;
    }
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

  public isPermanent(cookieStoreId: CookieStoreId) {
    if (
      cookieStoreId !== `${this.background.containerPrefix}-default` &&
      !this.storage.local.tempContainers[cookieStoreId]
    ) {
      return true;
    }
    return false;
  }

  public isTemporary(cookieStoreId: CookieStoreId, type?: 'deletesHistory') {
    return !!(
      this.storage.local.tempContainers[cookieStoreId] &&
      (!type || this.storage.local.tempContainers[cookieStoreId][type])
    );
  }

  public isClean(cookieStoreId: CookieStoreId) {
    return (
      this.storage.local.tempContainers[cookieStoreId] &&
      this.storage.local.tempContainers[cookieStoreId].clean
    );
  }

  public markUnclean(tabId: TabId) {
    const cookieStoreId = this.tabs.containerMap.get(tabId);
    if (cookieStoreId && this.isClean(cookieStoreId)) {
      debug(
        '[markUnclean] marking tmp container as not clean anymore',
        cookieStoreId
      );
      this.storage.local.tempContainers[cookieStoreId].clean = false;
    }
  }

  public getReusedContainerNumber() {
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

  public getAvailableContainerColors() {
    // even out colors
    let availableColors = [];
    const containersOptions = Object.values(this.storage.local.tempContainers);
    const assignedColors: {
      [key: string]: number;
    } = {};
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

  public removeFromStorage(cookieStoreId: CookieStoreId) {
    this.storage.local.tempContainersNumbers = this.storage.local.tempContainersNumbers.filter(
      containerNumber =>
        this.storage.local.tempContainers[cookieStoreId].number !==
        containerNumber
    );
    delete this.storage.local.tempContainers[cookieStoreId];
    return this.storage.persist();
  }

  public getType(cookieStoreId: CookieStoreId) {
    return this.storage.local.tempContainers[cookieStoreId].deletesHistory
      ? 'deletesHistory'
      : 'regular';
  }

  public getRemovalDelay(cookieStoreId: CookieStoreId) {
    return this.getType(cookieStoreId) === 'deletesHistory'
      ? this.pref.deletesHistory.containerRemoval
      : this.pref.container.removal;
  }

  public cleanupNumbers() {
    this.storage.local.tempContainersNumbers = Object.values(
      this.storage.local.tempContainers
    ).map(container => container.number);
  }

  public cleanupNumber(cookieStoreId: CookieStoreId) {
    this.storage.local.tempContainersNumbers = this.storage.local.tempContainersNumbers.filter(
      containerNumber =>
        this.storage.local.tempContainers[cookieStoreId].number !==
        containerNumber
    );
  }

  public getAllIds() {
    return Object.keys(this.storage.local.tempContainers);
  }
}
