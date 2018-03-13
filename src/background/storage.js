class Storage {
  constructor() {
    this.loaded = false;
    this.loading = false;
    this.local = null;
    this.preferencesDefault = {
      automaticMode: false,
      automaticModeNewTab: 'created',
      isolationGlobal: 'never',
      isolationDomain: {},
      isolationMac: 'disabled',
      isolationMacContainer: {},
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
      deletesHistoryContextMenu: false,
      deletesHistoryContainerAlwaysPerWebsite: 'never',
      deletesHistoryContainerIsolation: 'never',
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
      pageAction: false,
      replaceTabs: false,
      ignoreRequestsToAMO: true,
      ignoreRequestsToPocket: true
    };
    this.loadErrorRetryTime = 1000;
    this.loadErrorCount = 0;
  }

  async load() {
    if (this.loaded) {
      debug('[load] already loaded');
      return;
    }
    if (this.loading) {
      debug('[load] we are already loading storage, just wait until its loaded');
      while (!this.loaded) {
        debug('[load] waiting', this.loadErrorRetryTime);
        await delay(this.loadErrorRetryTime);
      }
      return;
    }
    this.loading = true;
    while (!this.loaded) {
      // we stay in this loop until we can load the storage
      // this prevents the add-on from entering a corrupt state
      const loaded = await this._load();
      if (loaded) {
        this.loaded = true;
        this.loading = false;
      } else {
        debug('[load] couldnt load storage, retrying', this.loadErrorRetryTime);
        await delay(this.loadErrorRetryTime);
      }
    }
  }

  async _load() {
    try {
      this.local = await browser.storage.local.get();
      if (!this.local || !Object.keys(this.local).length) {
        this.loadErrorCount++;
        // eslint-disable-next-line no-console
        console.error('[_load] empty storage loaded, this should never happen', this.loadErrorCount);
        if (this.loadErrorCount === 10) {
          // eslint-disable-next-line no-console
          console.error('[_load] storage seems to not get initialized correctly, showing preferences', this.loadErrorCount);
          this.loadErrorRetryTime = 5000;
          const optionsUrl = browser.runtime.getURL('ui/options.html');
          await browser.tabs.create({
            url: optionsUrl
          });
        }
        return false;
      }
      debug('[_load] storage loaded', this.local);

      let persist = false;
      if (this.maybeInitializeMissingStatistics()) {
        persist = true;
      }
      if (this.maybeInitializeMissingPreferences()) {
        persist = true;
      }
      if (persist) {
        await this.persist();
      }

      return true;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('[_load] error while loading local storage', error);
      return false;
    }
  }

  async persist() {
    try {
      if ((!this.local || !Object.keys(this.local).length) ||
          !this.local.tempContainers ||
          !this.local.preferences ||
          !this.local.statistics) {
        debug('[persist] tried to persist corrupt storage, try to load whats in storage and dont persist', this.local);
        this.load();
        return false;
      }
      await browser.storage.local.set(this.local);
      debug('[persist] storage persisted');
      return true;
    } catch (error) {
      debug('[persist] something went wrong while trying to persist the storage', error);
      return false;
    }
  }


  async initializeStorageOnInstallation() {
    this.loading = true;
    this.local = {
      tempContainerCounter: 0,
      tempContainers: {},
      tabContainerMap: {},
      preferences: this.preferencesDefault
    };
    this.maybeInitializeMissingStatistics();
    const persisted = await this.persist();
    if (!persisted) {
      debug('[initializeStorageOnInstallation] something went wrong while initializing storage');
      return false;
    } else {
      debug('[initializeStorageOnInstallation] storage initialized');
      this.loaded = true;
      this.loading = false;
      return true;
    }
  }

  async maybeInitializeMissingStatistics() {
    let storagePersistNeeded = false;
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
    return storagePersistNeeded;
  }

  async maybeInitializeMissingPreferences() {
    let storagePersistNeeded = false;
    if (!this.local.preferences) {
      // legacy code
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
    return storagePersistNeeded;
  }
}

window.Storage = Storage;