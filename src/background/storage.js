class TmpStorage {
  constructor(background) {
    this.background = background;
    this.installed = false;
    this.local = null;

    this.defaults = {
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
      preferences: background.preferences.defaults,
      lastFileExport: false,
      version: false
    };
  }

  async initialize() {
    this.local = await browser.storage.local.get();

    // empty storage *should* mean new install
    if (!this.local || !Object.keys(this.local).length) {
      return this.install();
    }

    debug('[initialize] storage initialized', this.local);
    if (this.background.utils.addMissingKeys({
      defaults: this.defaults,
      source: this.local
    })) {
      await this.persist();
    }

    // migrate if currently running version is different from version in storage
    if (this.background.version !== this.local.version) {
      try {
        await this.background.migration.migrate({
          preferences: this.local.preferences,
          previousVersion: this.local.version
        });
      } catch (error) {
        debug('[initialize] migration failed', error.toString());
      }
    }

    return true;
  }

  async persist() {
    try {
      if (!this.local || !Object.keys(this.local).length) {
        debug('[persist] tried to persist corrupt storage', this.local);
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
    debug('[install] installing storage');

    this.local = this.background.utils.clone(this.defaults);
    this.local.version = this.background.version;

    if (this.background.browserVersion < 67) {
      this.local.preferences.container.color = 'red';
    }

    if (!await this.persist()) {
      throw(new Error('[install] something went wrong while installing'));
    }
    debug('[install] storage installed', this.local);
    this.installed = true;
    return true;
  }
}

window.TmpStorage = TmpStorage;