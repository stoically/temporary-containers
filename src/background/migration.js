class Migration {
  initialize(background) {
    this.storage = background;
  }

  /* istanbul ignore next */
  async onUpdateMigration(details) {
    await this.storage.load();

    const previousVersion = details.previousVersion.replace('beta', '.');
    debug('updated from version', details.previousVersion, previousVersion);
    if (versionCompare('0.16', previousVersion) >= 0) {
      debug('updated from version <= 0.16, adapt old automaticmode behaviour if necessary');
      if (!this.storage.local.preferences.automaticMode) {
        this.storage.local.preferences.linkClickGlobal.middle.action = 'never';
        this.storage.local.preferences.linkClickGlobal.ctrlleft.action = 'never';
        await this.storage.persist();
      }
    }
    if (versionCompare('0.33', previousVersion) >= 0) {
      debug('updated from version <= 0.33, make sure to set all left-clicks to "never"');
      this.storage.local.preferences.linkClickGlobal.left.action = 'never';
      const linkClickDomainPatterns = Object.keys(this.storage.local.preferences.linkClickDomain);
      if (linkClickDomainPatterns.length) {
        linkClickDomainPatterns.map(linkClickDomainPattern => {
          this.storage.local.preferences.linkClickDomain[linkClickDomainPattern].left.action = 'never';
        });
      }
      await this.storage.persist();
    }
    if (versionCompare('0.57', previousVersion) >= 0) {
      debug('updated from version <= 0.57, potentially inform user about automatic mode preference change');
      if (this.storage.local.preferences.automaticMode &&
          this.storage.local.preferences.automaticModeNewTab === 'navigation') {
        this.storage.local.preferences.automaticModeNewTab = 'created';
        await this.storage.persist();

        const url = browser.runtime.getURL('tmpcontainer/ui/notifications/update_from_0.57_and_below.html');
        browser.tabs.create({
          url
        });
      }
    }
    if (versionCompare('0.59', previousVersion) >= 0) {
      debug('updated from version <= 0.59, potentially migrate always open in preferences');
      const alwaysOpenInDomains = Object.keys(this.storage.local.preferences.alwaysOpenInDomain);
      if (alwaysOpenInDomains.length) {
        alwaysOpenInDomains.map(alwaysOpenInDomainPattern => {
          this.storage.local.preferences.alwaysOpenInDomain[alwaysOpenInDomainPattern] = {
            allowedInPermanent: false
          };
        });
        await this.storage.persist();
      }
    }
    if (versionCompare('0.73', previousVersion) >= 0) {
      debug('updated from version <= 0.73, remove tabContainerMap from storage');
      delete this.storage.local.tabContainerMap;
      await this.storage.persist();
    }
  }
}

window.Migration = Migration;