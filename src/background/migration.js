class Migration {
  constructor(background) {
    this.background = background;
    this.storage = background.storage;
  }


  /* istanbul ignore next */
  async onUpdate(details) {
    debug('[onUpdate]', details);
    await this.storage.load();

    const previousVersion = details.previousVersion.replace('beta', '.');
    debug('updated from version', details.previousVersion, previousVersion);
    if (versionCompare('0.16', previousVersion) >= 0) {
      debug('updated from version <= 0.16, adapt old automaticmode behaviour if necessary');
      if (!this.storage.local.preferences.automaticMode) {
        this.storage.local.preferences.linkClickGlobal.middle.action = 'never';
        this.storage.local.preferences.linkClickGlobal.ctrlleft.action = 'never';
        await this.storage.persist();
      }
    }
    if (versionCompare('0.33', previousVersion) >= 0) {
      debug('updated from version <= 0.33, make sure to set all left-clicks to "never"');
      this.storage.local.preferences.linkClickGlobal.left.action = 'never';
      const linkClickDomainPatterns = Object.keys(this.storage.local.preferences.linkClickDomain);
      if (linkClickDomainPatterns.length) {
        linkClickDomainPatterns.map(linkClickDomainPattern => {
          this.storage.local.preferences.linkClickDomain[linkClickDomainPattern].left.action = 'never';
        });
      }
      await this.storage.persist();
    }
    if (versionCompare('0.57', previousVersion) >= 0) {
      debug('updated from version <= 0.57, potentially inform user about automatic mode preference change');
      if (this.storage.local.preferences.automaticMode &&
          this.storage.local.preferences.automaticModeNewTab === 'navigation') {
        this.storage.local.preferences.automaticModeNewTab = 'created';
        await this.storage.persist();

        const url = browser.runtime.getURL('ui/notifications/update_from_0.57_and_below.html');
        browser.tabs.create({
          url
        });
      }
    }
    if (versionCompare('0.59', previousVersion) >= 0) {
      debug('updated from version <= 0.59, potentially migrate always open in preferences');
      const alwaysOpenInDomains = Object.keys(this.storage.local.preferences.alwaysOpenInDomain);
      if (alwaysOpenInDomains.length) {
        alwaysOpenInDomains.map(alwaysOpenInDomainPattern => {
          this.storage.local.preferences.alwaysOpenInDomain[alwaysOpenInDomainPattern] = {
            allowedInPermanent: false
          };
        });
        await this.storage.persist();
      }
    }
    if (versionCompare('0.73', previousVersion) >= 0) {
      debug('updated from version <= 0.73, remove tabContainerMap from storage');
      delete this.storage.local.tabContainerMap;
      await this.storage.persist();
    }
    if (versionCompare('0.77', previousVersion) >= 0) {
      debug('updated from version <= 0.77, migrate preferences');
      const preferences = this.storage.local.preferences;
      const newPreferences = Object.assign({}, this.storage.preferencesDefault, {
        automaticMode: {
          active: preferences.automaticMode,
          newTab: preferences.automaticModeNewTab
        },
        notifications: preferences.notifications,
        container: {
          namePrefix: preferences.containerNamePrefix,
          color: preferences.containerColor,
          colorRandom: preferences.containerColorRandom,
          icon: preferences.containerIcon,
          iconRandom: preferences.containerIconRandom,
          numberMode: preferences.containerNumberMode,
          removal: preferences.containerRemoval
        },
        iconColor: preferences.iconColor,
        isolation: {
          global: {
            navigation: {
              action: preferences.isolationGlobal
            },
            mouseClick: preferences.linkClickGlobal
          },
          domain: {},
          mac: {
            action: preferences.isolationMac
          }
        },
        pageAction: preferences.pageAction,
        contextMenu: preferences.contextMenu,
        keyboardShortcuts: preferences.keyboardShortcuts,
        replaceTabs: preferences.replaceTabs,
        ignoreRequestsToAMO: preferences.ignoreRequestsToAMO,
        ignoreRequestsToPocket: preferences.ignoreRequestsToPocket,
        cookies: {
          domain: preferences.setCookiesDomain
        },
        deletesHistory: {
          automaticMode: preferences.deletesHistoryContainer,
          contextMenu: preferences.deletesHistoryContextMenu,
          containerAlwaysPerDomain: preferences.deletesHistoryContainerAlwaysPerWebsite,
          containerIsolation: preferences.deletesHistoryContainerIsolation,
          containerRemoval: preferences.deletesHistoryContainerRemoval,
          containerMouseClicks: preferences.deletesHistoryContainerMouseClicks,
          statistics: preferences.deletesHistoryStatistics
        },
        statistics: preferences.statistics,
      });

      const initIsolationDomain = (pattern) => {
        if (newPreferences.isolation.domain[pattern]) {
          return;
        }
        newPreferences.isolation.domain[pattern] = {
          always: {
            action: 'disabled',
            allowedInPermanent: false
          },
          navigation: {
            action: 'global'
          },
          mouseClick: {
            middle: {
              action: 'global'
            },
            ctrlleft: {
              action: 'global'
            },
            left: {
              action: 'global'
            }
          }
        };
      };

      Object.keys(preferences.alwaysOpenInDomain).map((pattern) => {
        initIsolationDomain(pattern);
        const _preferences = preferences.alwaysOpenInDomain[pattern];
        newPreferences.isolation.domain[pattern].always = {
          action: 'enabled',
          allowedInPermanent: _preferences.allowedInPermanent
        };
      });
      Object.keys(preferences.isolationDomain).map((pattern) => {
        initIsolationDomain(pattern);
        const _preferences = preferences.isolationDomain[pattern];
        newPreferences.isolation.domain[pattern].navigation = _preferences;
      });
      Object.keys(preferences.linkClickDomain).map((pattern) => {
        initIsolationDomain(pattern);
        const _preferences = preferences.linkClickDomain[pattern];
        newPreferences.isolation.domain[pattern].mouseClick = _preferences;
      });

      this.storage.local.preferences = newPreferences;
      delete this.storage.local.tabContainerMap;
      await this.storage.persist();
    }
    if (versionCompare('0.81', previousVersion) >= 0) {
      debug('updated from version <= 0.81, make sure we removed noContainerTabs and tabContainerMap from storage');
      delete this.storage.local.tabContainerMap;
      delete this.storage.local.noContainerTabs;
      await this.storage.persist();
    }
    if (versionCompare('0.87', previousVersion) >= 0) {
      debug('updated from version <= 0.87, inform user about management permission');
      const mangementPermission = await browser.permissions.contains({permissions: ['management']});
      if (!mangementPermission) {
        const url = browser.runtime.getURL('ui/notifications/update_from_0.87_and_below.html');
        browser.tabs.create({
          url
        });        
      }
    }
  }
}

window.Migration = Migration;