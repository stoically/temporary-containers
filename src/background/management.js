class Management {

  constructor() {
    this.addons = {
      '@testpilot-containers': {
        name: 'Firefox Multi-Account Containers',
        enabled: false,
        version: false
      },
      '@contain-facebook': {
        name: 'Facebook Container',
        enabled: false,
        version: false
      },
      '@contain-google': {
        name: 'Google Container',
        enabled: false,
        version: false
      },
      '@contain-twitter': {
        name: 'Twitter Container',
        enabled: false,
        version: false
      },
      '@contain-youtube': {
        name: 'YouTube Container',
        enabled: false,
        version: false
      },
      'containerise@kinte.sh': {
        name: 'Containerise',
        enabled: false,
        version: false
      },
    };
  }


  async initialize() {
    try {
      const extensions = await browser.management.getAll();
      extensions.map(extension => {
        if (!this.addons[extension.id]) {
          return;
        }
        this.addons[extension.id].enabled = extension.enabled;
        this.addons[extension.id].version = extension.version;
      });
    } catch (error) {
      debug('[management:initialize] couldnt getAll extensions', error);
    }

    browser.management.onDisabled.addListener(this.disable.bind(this));
    browser.management.onUninstalled.addListener(this.disable.bind(this));
    browser.management.onEnabled.addListener(this.enable.bind(this));
    browser.management.onInstalled.addListener(this.enable.bind(this));
  }


  disable(extension) {
    this.addons[extension.id].enabled = false;
    this.addons[extension.id].version = extension.version;
  }


  enable(extension) {
    this.addons[extension.id].enabled = true;
    this.addons[extension.id].version = extension.version;
  }
}

window.Management = Management;
