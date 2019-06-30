class TemporaryContainers {
  constructor() {
    this.initialized = false;

    this.storage = new window.TmpStorage(this);
    this.utils = new window.Utils(this);
    this.runtime = new window.Runtime(this);
    this.management = new window.Management(this);
    this.request = new window.TmpRequest(this);
    this.container = new window.Container(this);
    this.mouseclick = new window.MouseClick(this);
    this.tabs = new window.Tabs(this);
    this.commands = new window.Commands(this);
    this.browseraction = new window.BrowserAction(this);
    this.pageaction = new window.PageAction(this);
    this.contextmenu = new window.ContextMenu(this);
    this.cookies = new window.Cookies(this);
    this.isolation = new window.Isolation(this);
    this.statistics = new window.Statistics(this);
    this.mac = new window.MultiAccountContainers(this);
    this.migration = new window.Migration(this);
  }


  async initialize() {
    this.version = browser.runtime.getManifest().version;
    this.browserVersion = parseInt((await browser.runtime.getBrowserInfo()).version);
    const {permissions} = await browser.permissions.getAll();
    this.permissions = {
      bookmarks: permissions.includes('bookmarks'),
      history: permissions.includes('history'),
      notifications: permissions.includes('notifications'),
    };

    await this.storage.load();
    if (this.version !== this.storage.local.version) {
      await this.migration.migrate();
      this.storage.local.version = this.version;
      await this.storage.persist();
    }

    this.request.initialize();
    this.runtime.initialize();
    await this.container.initialize();
    this.mouseclick.initialize();
    this.commands.initialize();
    this.browseraction.initialize();
    this.pageaction.initialize();
    this.contextmenu.initialize();
    this.cookies.initialize();
    this.statistics.initialize();
    this.mac.initialize();
    this.isolation.initialize();

    await this.management.initialize();
    await this.tabs.initialize();

    browser.runtime.onMessage.addListener(this.runtime.onMessage.bind(this.runtime));

    this.initialized = true;
    window.tmpInitialized();
  }
}

window.TemporaryContainers = TemporaryContainers;
window.tmp = new TemporaryContainers();
browser.runtime.onStartup.addListener(tmp.runtime.onStartup.bind(tmp.runtime));
browser.runtime.onInstalled.addListener(tmp.runtime.onInstalled.bind(tmp.runtime));

/* istanbul ignore next */
if (!browser._mochaTest) {
  tmp.initialize();
}
