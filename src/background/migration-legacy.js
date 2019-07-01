// this is only needed once for upgrades from <1.0 and should be removed in the next major version
// we now store the addon version in storage instead of waiting for onInstalled

const migrationReadyAbortController = new AbortController;
let migrationReady;
const migrationReadyPromise = new Promise((resolve, reject) => {
  migrationReady = resolve;

  migrationReadyAbortController.signal.addEventListener('abort', () => {
    reject('[migration-legacy] waiting for migration ready timed out');
  });
}).catch(debug);
const migrationReadyTimeout = window.setTimeout(() => {
  migrationReadyAbortController.abort();
}, 10000);

const migrationOnInstalledListener = async function() {
  browser.runtime.onInstalled.removeListener(migrationOnInstalledListener);
  const {version} = await browser.storage.local.get('version');
  if (version) {
    clearTimeout(migrationReadyTimeout);
    debug('[migration-legacy] version found, skip', version);
    return;
  }

  await migrationReadyPromise;
  return tmp.migration.onInstalled.call(tmp.migration, ...arguments);
};
browser.runtime.onInstalled.addListener(migrationOnInstalledListener);

window.migrationLegacy = async (migration) => {
  try {
    debug('[migration-legacy] no previousVersion found, waiting for onInstalled');
    const updateDetails = await new Promise((resolve, reject) => {
      migration.onInstalled = resolve;
      window.setTimeout(() => {
        // onInstalled didnt fire, again.
        reject();
      }, 10000);
      debug('[migration-legacy] ready');
      migrationReady();
    });
    migration.previousVersion = updateDetails.previousVersion;
  } catch (error) {
    debug('[migration-legacy] waiting for onInstalled failed, assuming 0.103');
    migration.previousVersion = '0.103';
  }
};