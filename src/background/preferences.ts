import { TemporaryContainers } from './tmp';
import { BrowserAction } from './browseraction';
import { ContextMenu } from './contextmenu';
import { PageAction } from './pageaction';
import { PreferencesSchema, Permissions } from '~/types';
import { REDIRECTOR_DOMAINS_DEFAULT, IGNORED_DOMAINS_DEFAULT } from '~/shared';

export class Preferences {
  public defaults: PreferencesSchema = {
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
      domains: REDIRECTOR_DOMAINS_DEFAULT,
    },
    ignoreRequests: IGNORED_DOMAINS_DEFAULT,
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
  private permissions!: Permissions;
  private contextmenu!: ContextMenu;
  private browseraction!: BrowserAction;
  private pageaction!: PageAction;

  constructor(background: TemporaryContainers) {
    this.background = background;
  }

  initialize(): void {
    this.permissions = this.background.permissions;
    this.contextmenu = this.background.contextmenu;
    this.browseraction = this.background.browseraction;
    this.pageaction = this.background.pageaction;
  }

  async handleChanges({
    oldPreferences,
    newPreferences,
  }: {
    oldPreferences: PreferencesSchema;
    newPreferences: PreferencesSchema;
  }): Promise<void> {
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
