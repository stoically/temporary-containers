/* istanbul ignore */
import { TemporaryContainers } from '../background';
import { debug } from './log';
import { Storage } from './storage';
import { Utils } from './utils';
import { IsolationDomain } from '~/types';

export class Migration {
  private background: TemporaryContainers;
  private storage!: Storage;
  private utils!: Utils;
  private previousVersion!: string;
  private previousVersionBeta!: boolean;

  constructor(background: TemporaryContainers) {
    this.background = background;
  }

  public async migrate({
    preferences,
    previousVersion,
  }: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    preferences: any;
    previousVersion: string;
  }): Promise<void> {
    this.storage = this.background.storage;
    this.utils = this.background.utils;
    this.previousVersion = previousVersion;

    if (!this.previousVersion) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (window as any).migrationLegacy(this);
    }

    debug('[migrate] previousVersion', this.previousVersion);
    this.previousVersionBeta = false;
    if (this.previousVersion.includes('beta')) {
      this.previousVersionBeta = true;
      this.previousVersion = this.previousVersion.replace('beta', '.');
    }

    if (this.updatedFromVersionEqualToOrLessThan('0.91')) {
      debug(
        'updated from version <= 0.91, migrate container numbers into dedicated array'
      );
      Object.values(this.storage.local.tempContainers).map(container => {
        this.storage.local.tempContainersNumbers.push(container.number);
      });
    }

    if (this.updatedFromVersionEqualToOrLessThan('0.103', '1.0.1')) {
      debug(
        'updated from version <= 0.103, migrate deletesHistory.active and ignoreRequestsTo'
      );
      if (this.background.permissions.history) {
        preferences.deletesHistory.active = true;
      }

      if (preferences.ignoreRequestsToAMO === false) {
        preferences.ignoreRequests = preferences.ignoreRequests.filter(
          (ignoredPattern: string) => ignoredPattern !== 'addons.mozilla.org'
        );
      }
      if (preferences.ignoreRequestsToPocket === false) {
        preferences.ignoreRequests = preferences.ignoreRequests.filter(
          (ignoredPattern: string) => ignoredPattern !== 'getpocket.com'
        );
      }
      delete preferences.ignoreRequestsToAMO;
      delete preferences.ignoreRequestsToPocket;
    }

    if (this.updatedFromVersionEqualToOrLessThan('0.103', '1.0.6')) {
      debug(
        'updated from version <= 0.103, migrate per domain isolation to array'
      );
      const perDomainIsolation: IsolationDomain[] = [];
      Object.keys(preferences.isolation.domain).map(domainPattern => {
        perDomainIsolation.push(
          Object.assign(
            {
              pattern: domainPattern,
            },
            preferences.isolation.domain[domainPattern]
          )
        );
      });
      preferences.isolation.domain = perDomainIsolation;
    }

    if (this.updatedFromVersionEqualToOrLessThan('0.103')) {
      debug(
        '[migrate] updated from version <= 0.103, migrate popup default tab to isolation-per-domain'
      );
      if (preferences.browserActionPopup || preferences.pageAction) {
        preferences.ui.popupDefaultTab = 'isolation-per-domain';
      }
    }

    if (this.updatedFromVersionEqualToOrLessThan('1.1')) {
      debug(
        '[migrate] updated from version <= 1.1, migrate redirectorCloseTabs'
      );
      preferences.closeRedirectorTabs.domains.push('slack-redir.net');
    }

    if (this.updatedFromVersionEqualToOrLessThan('1.3', '1.4.1')) {
      debug('[migrate] updated from version <= 1.3, migrate container.removal');

      switch (preferences.container.removal) {
        case 'instant':
          preferences.container.removal = 0;
          break;

        case '2minutes':
          preferences.container.removal = 120000;
          break;

        case '5minutes':
          preferences.container.removal = 300000;
          break;

        case '15minutes':
          preferences.container.removal = 900000;
          break;
      }

      switch (preferences.deletesHistory.containerRemoval) {
        case 'instant':
          preferences.deletesHistory.containerRemoval = 0;
          break;

        case '15minutes':
          preferences.deletesHistory.containerRemoval = 900000;
          break;
      }
    }

    // hint: don't use preferences/storage-defaults here, ^
    // always hardcode, because the defaults change over time.
    // also keep in mind that missing keys get added before migration

    this.storage.local.version = this.background.version;
    this.storage.local.preferences = preferences;
    await this.storage.persist();
  }

  public updatedFromVersionEqualToOrLessThan(
    compareVersion: string,
    compareBetaVersion = ''
  ): boolean {
    if (compareBetaVersion && this.previousVersionBeta) {
      compareVersion = compareBetaVersion;
    }
    return this.utils.versionCompare(compareVersion, this.previousVersion) >= 0;
  }
}
