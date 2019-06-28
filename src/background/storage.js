class TmpStorage {
  constructor() {
    this.loaded = false;
    this.loading = false;
    this.local = null;
    this.preferencesDefault = {
      automaticMode: {
        active: false,
        newTab: 'created'
      },
      notifications: false,
      container: {
        namePrefix: 'tmp',
        color: 'toolbar',
        colorRandom: false,
        icon: 'circle',
        iconRandom: false,
        numberMode: 'keep',
        removal: '15minutes'
      },
      iconColor: 'default',
      isolation: {
        active: true,
        global: {
          navigation: {
            action: 'never'
          },
          mouseClick: {
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
          excluded: {},
          excludedContainers: {}
        },
        domain: {},
        mac: {
          action: 'disabled',
        }
      },
      browserActionPopup: false,
      pageAction: false,
      contextMenu: true,
      contextMenuBookmarks: false,
      keyboardShortcuts: {
        AltC: true,
        AltP: true,
        AltN: false,
        AltShiftC: false,
        AltX: false
      },
      replaceTabs: false,
      closeRedirectorTabs: {
        active: false,
        delay: 2000,
        domains: ['t.co', 'outgoing.prod.mozaws.net']
      },
      ignoreRequests: ['getpocket.com', 'addons.mozilla.org'],
      cookies: {
        domain: {}
      },
      deletesHistory: {
        active: false,
        automaticMode: 'never',
        contextMenu: false,
        contextMenuBookmarks: false,
        containerAlwaysPerDomain: 'never',
        containerIsolation: 'never',
        containerRemoval: 'instant',
        containerMouseClicks: 'never',
        statistics: false
      },
      statistics: false,
    };

    this.storageDefault = {
      tempContainerCounter: 0,
      tempContainers: {},
      tempContainersNumbers: [],
      statistics: {
        startTime: new Date,
        containersDeleted: 0,
        cookiesDeleted: 0,
        cacheDeleted: 0,
        deletesHistory: {
          containersDeleted: 0,
          cookiesDeleted: 0,
          urlsDeleted: 0
        }
      },
      preferences: this.preferencesDefault
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
          const optionsUrl = browser.runtime.getURL('options.html');
          await browser.tabs.create({
            url: optionsUrl
          });
        }
        return false;
      }
      debug('[_load] storage loaded', this.local);

      if (this.maybeAddMissingStorage()) {
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


  async install() {
    this.loading = true;
    this.local = JSON.parse(JSON.stringify(this.storageDefault));
    if (parseInt((await browser.runtime.getBrowserInfo()).version) < 67) {
      this.local.preferences.container.color = 'red';
    }
    const persisted = await this.persist();
    if (!persisted) {
      debug('[install] something went wrong while initializing storage');
      return false;
    } else {
      debug('[install] storage initialized', this.local);
      this.loaded = true;
      this.loading = false;
      return true;
    }
  }


  async maybeAddMissingStorage() {
    let storagePersistNeeded = false;

    // TODO maybe replace with Object.assign
    // but then we dont know whether something changed and need to persist every time
    const checkStorage = (storageDefault, storage) => {
      Object.keys(storageDefault).map(key => {
        if (storage[key] === undefined) {
          debug('[maybeAddMissingStorage] storage not found, setting default', key, storageDefault[key]);
          storage[key] = storageDefault[key];
          storagePersistNeeded = true;
        } else if (typeof storage[key] === 'object') {
          checkStorage(storageDefault[key], storage[key]);
        }
      });
    };
    checkStorage(this.storageDefault, this.local);

    return storagePersistNeeded;
  }
}

window.TmpStorage = TmpStorage;