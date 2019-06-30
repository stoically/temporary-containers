// this is only needed once for upgrades from <1.0 and should be removed one day
// we now store the addon version in storage instead of waiting for onInstalled

window.migrationLegacyReady = false;
const conditionalMigrationOnInstalled = new window.ConditionalCall({
  condition: () => window.migrationLegacyReady,
  func: async function() {
    return tmp.migration.onInstalled.call(tmp.migration, ...arguments);
  },
  timeout: 15000,
  name: 'migration-legacy',
  debug
});

const migrationOnInstalledListener = async function() {
  browser.runtime.onInstalled.removeListener(migrationOnInstalledListener);
  const {version} = await browser.storage.local.get('version');
  if (version) {
    debug('[migration-legacy] version found, skip', version);
    return;
  }

  conditionalMigrationOnInstalled.func.call(this, ...arguments);
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
      }, 15000);
      window.migrationLegacyReady = true;
      conditionalMigrationOnInstalled.met();
    });
    migration.previousVersion = updateDetails.previousVersion;
  } catch (error) {
    debug('[migration-legacy] waiting for onInstalled failed, assuming 0.103');
    migration.previousVersion = '0.103';
  }
};