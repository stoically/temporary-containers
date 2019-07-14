/* eslint-disable require-atomic-updates */
/* istanbul ignore next */
class Migration {
  constructor(background) {
    this.background = background;
  }

  async migrate({preferences, previousVersion}) {
    this.storage = this.background.storage;
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
    if (this.updatedFromVersionEqualToOrLessThan('0.103')) {
      debug('[migrate] updated from version <= 0.103, migrate popup default tab to isolation-per-domain');
      if (preferences.browserActionPopup || preferences.pageAction) {
        preferences.ui.popupDefaultTab = 'isolation-per-domain';
      }
    }
    if (this.updatedFromVersionEqualToOrLessThan('1.0')) {
      debug('[migrate] updated from version <= 1.0, migrate redirectorCloseTabs');
      preferences.closeRedirectorTabs.domains.push('slack-redir.net');
    }

    // hint: don't use preferences/storage-defaults here, ^
    // always hardcode, because the defaults change over time.
    // also keep in mind that missing keys get added before migration

    this.storage.local.version = this.background.version;
    this.storage.local.preferences = preferences;
    await this.storage.persist();
  }

  updatedFromVersionEqualToOrLessThan(compareVersion) {
    return versionCompare(compareVersion, this.previousVersion) >= 0;
  }
}

window.Migration = Migration;