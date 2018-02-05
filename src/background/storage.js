const { debug } = require('./log');

class Storage {
  constructor() {
    this.local = null;
    this.preferencesDefault = {
      automaticMode: true,
      automaticModeNewTab: 'created',
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
      iconColor: 'default',
      historyPermission: false,
      deletesHistoryContainer: 'never',
      deletesHistoryContainerMouseClicks: 'never'
    };
  }

  async load() {
    try {
      let storagePersistNeeded = false;
      this.local = await browser.storage.local.get();
      if (!Object.keys(this.local).length) {
        this.local = {
          tempContainerCounter: 0,
          tempContainers: {},
          tabContainerMap: {},
          preferences: this.preferencesDefault
        };
        debug('storage empty, setting defaults');
        storagePersistNeeded = true;
      } else {
        debug('storage loaded', this.local);
      }
      // set preferences defaults if not present
      if (!this.local.preferences) {
        debug('no preferences found, setting defaults', this.preferencesDefault);
        this.local.preferences = this.preferencesDefault;
        storagePersistNeeded = true;
      } else {
        Object.keys(this.preferencesDefault).map(key => {
          if (this.local.preferences[key] === undefined) {
            debug('preference not found, setting default', key, this.preferencesDefault[key]);
            this.local.preferences[key] = this.preferencesDefault[key];
            storagePersistNeeded = true;
          }
        });
      }

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
      debug('storage persisted');
    } catch (error) {
      debug('something went wrong while trying to persist the storage', error);
    }
  }
}

module.exports = Storage;
