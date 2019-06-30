/* eslint-disable require-atomic-updates */
/* istanbul ignore next */
class Migration {
  constructor(background) {
    this.background = background;
  }

  async migrate({preferences, previousVersion}) {
    this.storage = this.background.storage;
    this.preferences = this.background.preferences;
    this.previousVersion = previousVersion;

    if (!this.previousVersion) {
      await window.migrationLegacy(this);
    }

    debug('[migrate] previousVersion', this.previousVersion);
    this.previousVersionBeta = false;
    if (this.previousVersion.includes('beta')) {
      this.previousVersionBeta = true;
      this.previousVersion = this.previousVersion.replace('beta', '.');
    }

    if (this.updatedFromVersionEqualToOrLessThan('0.16')) {
      debug('updated from version <= 0.16, adapt old automaticmode behaviour if necessary');
      if (!preferences.automaticMode) {
        preferences.linkClickGlobal.middle.action = 'never';
        preferences.linkClickGlobal.ctrlleft.action = 'never';
      }
    }
    if (this.updatedFromVersionEqualToOrLessThan('0.33')) {
      debug('updated from version <= 0.33, make sure to set all left-clicks to "never"');
      preferences.linkClickGlobal.left.action = 'never';
      const linkClickDomainPatterns = Object.keys(preferences.linkClickDomain);
      if (linkClickDomainPatterns.length) {
        linkClickDomainPatterns.map(linkClickDomainPattern => {
          preferences.linkClickDomain[linkClickDomainPattern].left.action = 'never';
        });
      }
    }
    if (this.updatedFromVersionEqualToOrLessThan('0.57')) {
      debug('updated from version <= 0.57, potentially inform user about automatic mode preference change');
      if (preferences.automaticMode &&
          preferences.automaticModeNewTab === 'navigation') {
        preferences.automaticModeNewTab = 'created';

        const url = browser.runtime.getURL('notifications/update_from_0.57_and_below.html');
        browser.tabs.create({
          url
        });
      }
    }
    if (this.updatedFromVersionEqualToOrLessThan('0.59')) {
      debug('updated from version <= 0.59, potentially migrate always open in preferences');
      const alwaysOpenInDomains = Object.keys(preferences.alwaysOpenInDomain);
      if (alwaysOpenInDomains.length) {
        alwaysOpenInDomains.map(alwaysOpenInDomainPattern => {
          preferences.alwaysOpenInDomain[alwaysOpenInDomainPattern] = {
            allowedInPermanent: false
          };
        });

      }
    }
    if (this.updatedFromVersionEqualToOrLessThan('0.73')) {
      debug('updated from version <= 0.73, remove tabContainerMap from storage');
      delete this.storage.local.tabContainerMap;
    }
    if (this.updatedFromVersionEqualToOrLessThan('0.77')) {
      debug('updated from version <= 0.77, migrate preferences');
      const newPreferences = Object.assign({}, this.preferences.defaults, {
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

      preferences = newPreferences;
      delete this.storage.local.tabContainerMap;
    }
    if (this.updatedFromVersionEqualToOrLessThan('0.81')) {
      debug('updated from version <= 0.81, make sure we removed noContainerTabs and tabContainerMap from storage');
      delete this.storage.local.tabContainerMap;
      delete this.storage.local.noContainerTabs;
    }
    if (this.updatedFromVersionEqualToOrLessThan('0.87')) {
      debug('updated from version <= 0.87, inform user about management permission');
      const mangementPermission = await browser.permissions.contains({permissions: ['management']});
      if (!mangementPermission) {
        const url = browser.runtime.getURL('notifications/update_from_0.87_and_below.html');
        browser.tabs.create({
          url
        });
      }
    }
    if (this.updatedFromVersionEqualToOrLessThan('0.91')) {
      debug('updated from version <= 0.91, migrate container numbers into dedicated array');
      Object.values(this.storage.local.tempContainers).map(container => {
        this.storage.local.tempContainersNumbers.push(container.number);
      });
    }
    if ((this.updatedFromVersionEqualToOrLessThan('0.103') && !this.previousVersionBeta) ||
      (this.previousVersionBeta && this.updatedFromVersionEqualToOrLessThan('1.0.1'))) {
      debug('updated from version <= 0.103, migrate deletesHistory.active and ignoreRequestsTo');
      if (this.background.permissions.history) {
        preferences.deletesHistory.active = true;
      }

      if (preferences.ignoreRequestsToAMO === false) {
        preferences.ignoreRequests =
          preferences.ignoreRequests.filter(ignoredPattern =>
            ignoredPattern !== 'addons.mozilla.org'
          );
      }
      if (preferences.ignoreRequestsToPocket === false) {
        preferences.ignoreRequests =
          preferences.ignoreRequests.filter(ignoredPattern =>
            ignoredPattern !== 'getpocket.com'
          );
      }
      delete preferences.ignoreRequestsToAMO;
      delete preferences.ignoreRequestsToPocket;
    }
    if ((this.updatedFromVersionEqualToOrLessThan('0.103') && !this.previousVersionBeta) ||
      (this.previousVersionBeta && this.updatedFromVersionEqualToOrLessThan('1.0.6'))) {
      debug('updated from version <= 0.103, migrate per domain isolation to array');
      const perDomainIsolation = [];
      Object.keys(preferences.isolation.domain).map(domainPattern => {
        perDomainIsolation.push(Object.assign({
          pattern: domainPattern,
        }, preferences.isolation.domain[domainPattern]));
      });
      preferences.isolation.domain = perDomainIsolation;
    }

    this.storage.local.version = this.background.version;
    this.storage.local.preferences = preferences;
    await this.storage.persist();
  }

  updatedFromVersionEqualToOrLessThan(compareVersion) {
    return versionCompare(compareVersion, this.previousVersion) >= 0;
  }
}

window.Migration = Migration;