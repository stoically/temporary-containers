class TemporaryContainers {
  constructor() {
    this.initialized = false;

    this.storage = new window.Storage;
    this.utils = new window.Utils(this);
    this.runtime = new window.Runtime(this);
    this.management = new window.Management(this);
    this.request = new window.Request(this);
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
    // register message listener
    browser.runtime.onMessage.addListener(this.runtime.onMessage.bind(this));

    // TODO cache permissions in storage based on firefox version >=60.0b1
    // https://bugzilla.mozilla.org/show_bug.cgi?id=1402850
    // https://developer.mozilla.org/en-US/Add-ons/WebExtensions/API/runtime/getBrowserInfo
    this.permissions = {
      bookmarks: await browser.permissions.contains({permissions: ['bookmarks']}),
      history: await browser.permissions.contains({permissions: ['history']}),
      notifications: await browser.permissions.contains({permissions: ['notifications']})
    };

    await this.storage.load();

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

    await this.management.initialize();
    await this.tabs.initialize();

    this.initialized = true;
  }
}

window.TemporaryContainers = TemporaryContainers;
window.tmp = new TemporaryContainers();
browser.runtime.onInstalled.addListener(tmp.runtime.onInstalled.bind(tmp));
browser.runtime.onStartup.addListener(tmp.runtime.onStartup.bind(tmp));

/* istanbul ignore next */
if (!browser._mochaTest) {
  tmp.initialize();
}
