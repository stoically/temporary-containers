import { TemporaryContainers } from '../background';
import { BrowserAction } from './browseraction';
import { ContainerColor, ContainerIcon } from './container';
import { ContextMenu } from './contextmenu';
import { PageAction } from './pageaction';

const IGNORED_DOMAINS = ['getpocket.com', 'addons.mozilla.org'];
const REDIRECTOR_DOMAINS = [
  't.co',
  'outgoing.prod.mozaws.net',
  'slack-redir.net',
];

export type Milliseconds = number;
export type IgnoredDomain = typeof IGNORED_DOMAINS[number] | string;
export type RedirectorDomain = typeof REDIRECTOR_DOMAINS[number] | string;

export type IsolationAction =
  | 'never'
  | 'notsamedomain'
  | 'notsamedomainexact'
  | 'always'
  | 'global';

export interface IIsolationGlobal {
  navigation: {
    action: IsolationAction;
  };
  mouseClick: {
    middle: {
      action: IsolationAction;
      container: 'default' | 'deleteshistory';
    };
    ctrlleft: {
      action: IsolationAction;
      container: 'default' | 'deleteshistory';
    };
    left: {
      action: IsolationAction;
      container: 'default' | 'deleteshistory';
    };
  };
  excluded: {
    [key: string]: object;
  };
  excludedContainers: {
    [key: string]: object;
  };
}

export interface IIsolationDomain extends IIsolationGlobal {
  pattern: string;
  always: {
    action: 'enabled' | 'disabled';
    allowedInPermanent: boolean;
    allowedInTemporary: boolean;
  };
}

export interface ICookie {
  domain: string;
  expirationDate: string;
  firstPartyDomain: string;
  httpOnly: '' | 'true' | 'false';
  name: string;
  path: string;
  sameSite: '' | 'no_restriction' | 'lax' | 'strict';
  secure: '' | 'true' | 'false';
  url: string;
  value: string;
}

export type ToolbarIconColor =
  | 'default'
  | 'black-simple'
  | 'blue-simple'
  | 'red-simple'
  | 'white-simple';

export interface IPreferences {
  automaticMode: {
    active: boolean;
    newTab: 'created' | 'navigation';
  };
  notifications: boolean;
  container: {
    namePrefix: string;
    color: ContainerColor;
    colorRandom: boolean;
    colorRandomExcluded: ContainerColor[];
    icon: ContainerIcon;
    iconRandom: boolean;
    iconRandomExcluded: ContainerIcon[];
    numberMode: 'keep' | 'keepuntilrestart' | 'reuse' | 'hide';
    removal: Milliseconds;
  };
  iconColor: ToolbarIconColor;
  isolation: {
    active: boolean;
    global: IIsolationGlobal;
    domain: IIsolationDomain[];
    mac: {
      action: 'enabled' | 'disabled';
    };
  };
  browserActionPopup: boolean;
  pageAction: boolean;
  contextMenu: boolean;
  contextMenuBookmarks: boolean;
  keyboardShortcuts: {
    AltC: boolean;
    AltP: boolean;
    AltN: boolean;
    AltShiftC: boolean;
    AltX: boolean;
    AltO: boolean;
    AltI: boolean;
  };
  replaceTabs: boolean;
  closeRedirectorTabs: {
    active: boolean;
    delay: number;
    domains: RedirectorDomain[];
  };
  ignoreRequests: IgnoredDomain[];
  cookies: {
    domain: {
      [key: string]: ICookie[];
    };
  };
  deletesHistory: {
    active: boolean;
    automaticMode: 'never' | 'automatic';
    contextMenu: boolean;
    contextMenuBookmarks: boolean;
    containerAlwaysPerDomain: 'never' | 'automatic';
    containerIsolation: 'never' | 'automatic';
    containerRemoval: Milliseconds;
    containerMouseClicks: 'never' | 'automatic';
    statistics: boolean;
  };
  statistics: boolean;
  ui: {
    expandPreferences: boolean;
    popupDefaultTab:
      | 'isolation-global'
      | 'isolation-per-domain'
      | 'isolation-mac'
      | 'actions'
      | 'statistics';
  };
}

export class Preferences {
  public defaults: IPreferences = {
    automaticMode: {
      active: false,
      newTab: 'created',
    },
    notifications: false,
    container: {
      namePrefix: 'tmp',
      color: 'toolbar',
      colorRandom: false,
      colorRandomExcluded: [],
      icon: 'circle',
      iconRandom: false,
      iconRandomExcluded: [],
      numberMode: 'keep',
      removal: 900000, // ms
    },
    iconColor: 'default',
    isolation: {
      active: true,
      global: {
        navigation: {
          action: 'never',
        },
        mouseClick: {
          middle: {
            action: 'never',
            container: 'default',
          },
          ctrlleft: {
            action: 'never',
            container: 'default',
          },
          left: {
            action: 'never',
            container: 'default',
          },
        },
        excluded: {},
        excludedContainers: {},
      },
      domain: [],
      mac: {
        action: 'disabled',
      },
    },
    browserActionPopup: false,
    pageAction: false,
    contextMenu: true,
    contextMenuBookmarks: false,
    keyboardShortcuts: {
      AltC: true,
      AltP: true,
      AltN: false,
      AltShiftC: false,
      AltX: false,
      AltO: false,
      AltI: false,
    },
    replaceTabs: false,
    closeRedirectorTabs: {
      active: false,
      delay: 2000,
      domains: REDIRECTOR_DOMAINS,
    },
    ignoreRequests: IGNORED_DOMAINS,
    cookies: {
      domain: {},
    },
    deletesHistory: {
      active: false,
      automaticMode: 'never',
      contextMenu: false,
      contextMenuBookmarks: false,
      containerAlwaysPerDomain: 'never',
      containerIsolation: 'never',
      containerRemoval: 0, // ms
      containerMouseClicks: 'never',
      statistics: false,
    },
    statistics: false,
    ui: {
      expandPreferences: false,
      popupDefaultTab: 'isolation-global',
    },
  };

  private background: TemporaryContainers;
  private permissions: any;
  private contextmenu!: ContextMenu;
  private browseraction!: BrowserAction;
  private pageaction!: PageAction;

  constructor(background: TemporaryContainers) {
    this.background = background;
  }

  public initialize() {
    this.permissions = this.background.permissions;
    this.contextmenu = this.background.contextmenu;
    this.browseraction = this.background.browseraction;
    this.pageaction = this.background.pageaction;
  }

  public async handleChanges({
    oldPreferences,
    newPreferences,
  }: {
    oldPreferences: IPreferences;
    newPreferences: IPreferences;
  }) {
    if (oldPreferences.iconColor !== newPreferences.iconColor) {
      this.browseraction.setIcon(newPreferences.iconColor);
    }
    if (
      oldPreferences.browserActionPopup !== newPreferences.browserActionPopup
    ) {
      if (newPreferences.browserActionPopup) {
        this.browseraction.setPopup();
      } else {
        this.browseraction.unsetPopup();
      }
    }
    if (oldPreferences.pageAction !== newPreferences.pageAction) {
      this.pageaction.showOrHide();
    }
    if (oldPreferences.isolation.active !== newPreferences.isolation.active) {
      this.pageaction.showOrHide();
      if (newPreferences.isolation.active) {
        this.browseraction.removeIsolationInactiveBadge();
      } else {
        this.browseraction.addIsolationInactiveBadge();
      }
    }
    if (newPreferences.notifications) {
      this.permissions.notifications = true;
    }
    if (newPreferences.deletesHistory.active) {
      this.permissions.history = true;
    }
    if (
      newPreferences.contextMenuBookmarks ||
      newPreferences.deletesHistory.contextMenuBookmarks
    ) {
      this.permissions.bookmarks = true;
    }

    if (
      oldPreferences.contextMenu !== newPreferences.contextMenu ||
      oldPreferences.contextMenuBookmarks !==
        newPreferences.contextMenuBookmarks ||
      oldPreferences.deletesHistory.contextMenu !==
        newPreferences.deletesHistory.contextMenu ||
      oldPreferences.deletesHistory.contextMenuBookmarks !==
        newPreferences.deletesHistory.contextMenuBookmarks
    ) {
      await this.contextmenu.remove();
      this.contextmenu.add();
    }
  }
}
