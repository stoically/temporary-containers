class Preferences {
  constructor(background) {
    this.background = background;

    this.defaults = {
      automaticMode: {
        active: false,
        newTab: 'created'
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
        removal: '15minutes'
      },
      iconColor: 'default',
      isolation: {
        active: true,
        global: {
          navigation: {
            action: 'never'
          },
          mouseClick: {
            middle: {
              action: 'never',
              container: 'default'
            },
            ctrlleft: {
              action: 'never',
              container: 'default'
            },
            left: {
              action: 'never',
              container: 'default'
            }
          },
          excluded: {},
          excludedContainers: {}
        },
        domain: [],
        mac: {
          action: 'disabled',
        }
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
        AltO: false
      },
      replaceTabs: false,
      closeRedirectorTabs: {
        active: false,
        delay: 2000,
        domains: ['t.co', 'outgoing.prod.mozaws.net']
      },
      ignoreRequests: ['getpocket.com', 'addons.mozilla.org'],
      cookies: {
        domain: {}
      },
      deletesHistory: {
        active: false,
        automaticMode: 'never',
        contextMenu: false,
        contextMenuBookmarks: false,
        containerAlwaysPerDomain: 'never',
        containerIsolation: 'never',
        containerRemoval: 'instant',
        containerMouseClicks: 'never',
        statistics: false
      },
      statistics: false,
      ui: {
        expandPreferences: false,
        popupDefaultTab: 'isolation-global',
        isolation: {
          introHintClosed: false,
          mouseclickHintClosed: false
        }
      },
    };
  }

  initialize() {
    this.storage = this.background.storage;
    this.permissions = this.background.permissions;
    this.contextmenu = this.background.contextmenu;
    this.browseraction = this.background.browseraction;
    this.pageaction = this.background.pageaction;
  }

  async handleChanges({oldPreferences, newPreferences}) {
    if (oldPreferences.iconColor !== newPreferences.iconColor) {
      this.browseraction.setIcon(newPreferences.iconColor);
    }
    if (oldPreferences.browserActionPopup !== newPreferences.browserActionPopup) {
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
    if (newPreferences.contextMenuBookmarks || newPreferences.deletesHistory.contextMenuBookmarks) {
      this.permissions.bookmarks = true;
    }

    if (oldPreferences.contextMenu !== newPreferences.contextMenu ||
      oldPreferences.contextMenuBookmarks !== newPreferences.contextMenuBookmarks ||
      oldPreferences.deletesHistory.contextMenu !== newPreferences.deletesHistory.contextMenu ||
      oldPreferences.deletesHistory.contextMenuBookmarks !== newPreferences.deletesHistory.contextMenuBookmarks)  {
      await this.contextmenu.remove();
      this.contextmenu.add();
    }
  }
}

window.Preferences = Preferences;