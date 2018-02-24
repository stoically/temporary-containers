const delay = require('delay');
const { debug } = require('./log');

class Storage {
  constructor() {
    this.loaded = false;
    this.local = null;
    this.preferencesDefault = {
      automaticMode: false,
      automaticModeNewTab: 'created',
      linkClickGlobal: {
        middle: {
          action: 'never',
          container: 'default'
        },
        ctrlleft: {
          action: 'never',
          container: 'default'
        },
        left: {
          action: 'never',
          container: 'default'
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
      containerRemoval: '15minutes',
      iconColor: 'default',
      historyPermission: false,
      deletesHistoryContainer: 'never',
      deletesHistoryContainerRemoval: 'instant',
      deletesHistoryContainerMouseClicks: 'never',
      keyboardShortcuts: {
        AltC: true,
        AltP: true,
        AltN: false,
        AltShiftC: false,
        AltX: false
      },
      notifications: false,
      statistics: false,
      deletesHistoryStatistics: false,
      setCookiesDomain: {},
      contextMenu: true,
      pageAction: false
    };
  }

  async load() {
    while (!this.loaded) {
      // we stay in this loop until we can load the storage
      // this prevents the add-on from entering a corrupt state
      const loaded = await this._load();
      if (loaded) {
        this.loaded = true;
      } else {
        debug('[load] couldnt load storage, retrying in 10s');
        await delay(10000);
      }
    }
  }

  async _load() {
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
      // initialize statistics if not present
      if (!this.local.statistics) {
        this.local.statistics = {
          startTime: new Date,
          containersDeleted: 0,
          cookiesDeleted: 0
        };
        storagePersistNeeded = true;
      }
      if (!this.local.statistics.deletesHistory) {
        this.local.statistics.deletesHistory = {
          containersDeleted: 0,
          cookiesDeleted: 0,
          urlsDeleted: 0
        };
        storagePersistNeeded = true;
      }
      // set preferences defaults if not present
      if (!this.local.preferences) {
        debug('no preferences found, setting defaults', this.preferencesDefault);
        this.local.preferences = this.preferencesDefault;
        storagePersistNeeded = true;
      } else {
        // TODO maybe replace with Object.assign
        // but then we dont know whether something changed and need to persist every time
        const checkPreferences = (preferencesDefault, preferences) => {
          Object.keys(preferencesDefault).map(key => {
            if (preferences[key] === undefined) {
              debug('preference not found, setting default', key, preferencesDefault[key]);
              preferences[key] = preferencesDefault[key];
              storagePersistNeeded = true;
            } else if (typeof preferences[key] === 'object') {
              checkPreferences(preferencesDefault[key], preferences[key]);
            }
          });
        };
        checkPreferences(this.preferencesDefault, this.local.preferences);
      }

      if (storagePersistNeeded) {
        await this.persist();
      }
      return true;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('error while loading local storage', error);
      return false;
    }
  }

  async persist() {
    try {
      if (!this.local ||
          !this.local.tempContainers ||
          !this.local.preferences ||
          !this.local.statistics) {
        debug('[persist] tried to persist corrupt storage, try to load whats in storage and dont persist', this.local);
        this.load();
        return;
      }
      await browser.storage.local.set(this.local);
      debug('storage persisted');
    } catch (error) {
      debug('something went wrong while trying to persist the storage', error);
    }
  }
}

module.exports = Storage;
