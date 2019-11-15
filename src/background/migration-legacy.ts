/* eslint-disable @typescript-eslint/no-explicit-any */
// this is only needed once for upgrades from <1.0 and should be removed in the next major version
// we now store the addon version in storage instead of waiting for onInstalled
import { TemporaryContainers } from './tmp';

export class MigrationLegacy {
  constructor(background: TemporaryContainers) {
    const debug = background.debug;

    const migrationReadyAbortController = new AbortController();
    let migrationReady: () => void;
    let migrationReadyTimeout: number;
    const migrationReadyPromise = new Promise((resolve, reject) => {
      migrationReady = resolve;

      migrationReadyAbortController.signal.addEventListener('abort', () => {
        reject('[migration-legacy] waiting for migration ready timed out');
      });
    }).catch(debug);

    const migrationOnInstalledListener = async (
      ...args: any[]
    ): Promise<any> => {
      browser.runtime.onInstalled.removeListener(migrationOnInstalledListener);
      const { version } = await browser.storage.local.get('version');
      if (version) {
        clearTimeout(migrationReadyTimeout);
        debug('[migration-legacy] version found, skip', version);
        return;
      }

      await migrationReadyPromise;
      return background.migration.onInstalled.call(
        background.migration,
        ...args
      );
    };
    browser.runtime.onInstalled.addListener(migrationOnInstalledListener);

    window.migrationLegacy = async (migration: any): Promise<any> => {
      try {
        debug(
          '[migration-legacy] no previousVersion found, waiting for onInstalled'
        );
        const updateDetails: any = await new Promise((resolve, reject) => {
          migration.onInstalled = resolve;
          window.setTimeout(() => {
            migrationReadyAbortController.abort();
            reject();
          }, 10000);
          debug('[migration-legacy] ready');
          migrationReady();
        });
        migration.previousVersion = updateDetails.previousVersion;
      } catch (error) {
        debug(
          '[migration-legacy] waiting for onInstalled failed, assuming 0.103'
        );
        migration.previousVersion = '0.103';
      }
    };
  }
}
