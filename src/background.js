class TemporaryContainers {
  constructor() {
    this.initialized = false;

    this.utils = new window.Utils;
    this.storage = new window.Storage;
    this.runtime = new window.Runtime;
    this.request = new window.Request;
    this.container = new window.Container;
    this.mouseclick = new window.MouseClick;
    this.tabs = new window.Tabs;
    this.commands = new window.Commands;
    this.browseraction = new window.BrowserAction;
    this.pageaction = new window.PageAction;
    this.contextmenu = new window.ContextMenu;
    this.mac = new window.MultiAccountContainers;
    this.migration = new window.Migration;
  }


  async initialize() {
    // register reset storage message listener
    browser.runtime.onMessage.addListener(this.runtimeOnMessageResetStorage.bind(this));

    // TODO cache history permission in storage when firefox bug is fixed
    // https://bugzilla.mozilla.org/show_bug.cgi?id=1283320
    this.permissions = {
      history: await browser.permissions.contains({permissions: ['history']}),
      notifications: await browser.permissions.contains({permissions: ['notifications']})
    };

    await this.storage.load();

    this.request.initialize(this);
    this.runtime.initialize(this);
    this.container.initialize(this);
    this.mouseclick.initialize(this);
    this.commands.initialize(this);
    this.contextmenu.initialize(this);
    this.browseraction.initialize(this);
    this.pageaction.initialize(this);
    this.mac.initialize(this);
    this.migration.initialize(this);
    await this.tabs.initialize(this);

    this.initialized = true;
  }


  async runtimeOnMessageResetStorage(message, sender) {
    if (typeof message !== 'object') {
      return;
    }
    switch (message.method) {
    case 'resetStorage':
      debug('[runtimeOnMessageResetStorage] resetting storage', message, sender);
      return this.storage.initializeStorage();
    }
  }


  async runtimeOnInstalled(details) {
    if (details.temporary) {
      log.DEBUG = true;
      log.temporary = true;
    }

    switch (details.reason) {
    case 'install':
      return this.storage.initializeStorage();

    case 'update':
      return this.migration.onUpdateMigration(details);
    }
  }


  async runtimeOnStartup() {
    await this.storage.load();

    // queue a container cleanup
    delay(15000).then(() => {
      this.container.cleanup(true);
    });
  }
}

window.TemporaryContainers = TemporaryContainers;
window.tmp = new TemporaryContainers();
browser.runtime.onInstalled.addListener(tmp.runtimeOnInstalled.bind(tmp));
browser.runtime.onStartup.addListener(tmp.runtimeOnStartup.bind(tmp));

/* istanbul ignore next */
if (!browser._mochaTest) {
  tmp.initialize();
}
