const { debug } = require('./log');

class Storage {
  constructor() {
    this.local = null;
    this.preferences = null;
    this.preferencesDefault = {
      automaticMode: true,
      linkClickGlobal: {
        middle: {
          action: 'always',
          overwriteAutomaticMode: false
        },
        ctrlleft: {
          action: 'always',
          overwriteAutomaticMode: false
        },
        left: {
          action: 'never',
          overwriteAutomaticMode: false
        }
      },
      linkClickDomain: {},
      alwaysOpenInDomain: {},
      containerNamePrefix: 'tmp',
      containerColor: 'red',
      containerColorRandom: false,
      containerIcon: 'circle',
      containerIconRandom: false,
      containerNumberMode: 'keep',
      iconColor: 'default'
    };
  }

  async load() {
    try {
      let storagePersistNeeded = false;
      this.local = await browser.storage.local.get();
      this.preferences = await browser.storage.sync.get();
      if (!Object.keys(this.local).length) {
        this.local = {
          tempContainerCounter: 0,
          tempContainers: {},
          tabContainerMap: {}
        };
        debug('storage empty, setting defaults');
        storagePersistNeeded = true;
      } else {
        debug('storage loaded', this.local);
      }

      // set preferences defaults if not present
      if (!Object.keys(this.preferences).length) {
        this.preferences = {...this.preferencesDefault, ...this.local.preferences};
        delete this.local.preferences;  // Migrate previous local preferences
        debug('no preferences found, setting defaults', this.preferencesDefault);
        storagePersistNeeded = true;
      }

      // Make sure to default missing preferences with default value
      this.preferences = {...this.preferencesDefault, ...this.preferences};

      if (storagePersistNeeded) {
        await this.persist();
      }
    } catch (error) {
      debug('error while loading local storage', error);
      // TODO: stop execution, inform user and/or retry?
    }
  }

  async persist() {
    try {
      await browser.storage.local.set(this.local);
      await browser.storage.sync.set(this.preferences);
      debug('storage persisted');
    } catch (error) {
      debug('something went wrong while trying to persist the storage', error);
    }
  }
}

module.exports = Storage;
