// this is only needed once for upgrades from <1.0 and should be removed one day
// we now store the addon version in storage instead of waiting for onInstalled

window.migrationLegacyReady = false;
let migrationTimedOut = false;
const migrationAbortController = new AbortController();
const migrationPromise = new Promise((resolve, reject) => {
  window.tmpMigrationReady = () => {
    debug('[migration-legacy] migration ready');
    resolve();
  };
  migrationAbortController.signal.addEventListener('abort', () => {
    debug('[migration-legacy] timed out while waiting for migration ready');
    migrationTimedOut = true;
    reject();
  });
});

const migrationWaitCall = (target, timeout) => window.waitCall({
  target, timeout, waitPromise: migrationPromise, abortController: migrationAbortController,
  timedOut: migrationTimedOut, check: () => !window.tmp || !window.migrationLegacyReady
});

const migrationWaitListener = async function() {
  const {version} = await browser.storage.local.get('version');
  if (version) {
    debug('[migration-legacy] version found, skip migrationWaitCall', version);
    return;
  }
  migrationWaitCall(['migration', 'onInstalled'], 30000).call(this, ...arguments);
  browser.runtime.onInstalled.removeListener(migrationWaitListener);
};
browser.runtime.onInstalled.addListener(migrationWaitListener);


window.migrationLegacy = async (migration) => {
  try {
    debug('[migration-legacy] no previousVersion found, waiting for onInstalled');
    const updateDetails = await new Promise((resolve, reject) => {
      migration.onInstalled = resolve;
      window.setTimeout(() => {
        // onInstalled didnt fire, again.
        reject();
      }, 10000);
      window.migrationLegacyReady = true;
      window.tmpMigrationReady();
    });
    migration.previousVersion = updateDetails.previousVersion;
  } catch (error) {
    debug('[migration-legacy] waiting for onInstalled failed, assuming 0.103');
    migration.previousVersion = '0.103';
  }
};