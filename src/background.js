class TemporaryContainers {
  constructor() {
    this.initialized = false;
    debug('[tmp] initializing');

    // TODO use import via script module instead of window vars when jsdom supports it
    // See: https://github.com/stoically/temporary-containers/issues/275
    this.utils = new window.Utils(this);
    this.preferences = new window.Preferences(this);
    this.storage = new window.TmpStorage(this);

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

    this.containerPrefix = 'firefox';
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

    this.preferences.initialize();
    await this.storage.initialize();

    this.pref = new Proxy(this.storage, {
      get(target, key) {
        return target.local.preferences[key];
      },
    });

    if (!this.storage.local.containerPrefix) {
      const browserInfo = await browser.runtime.getBrowserInfo();
      this.storage.local.containerPrefix = browserInfo.name.toLowerCase();
      await this.storage.persist();
    }
    this.containerPrefix = this.storage.local.containerPrefix;

    this.request.initialize();
    this.runtime.initialize();
    this.container.initialize();
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

    debug('[tmp] initialized');
    this.initialized = true;
    window.eventListeners.tmpInitialized(true);
    browser.browserAction.enable();
  }
}

browser.browserAction.disable();

window.TemporaryContainers = TemporaryContainers;
window.tmp = new TemporaryContainers();

(async () => {
  if (browser._mochaTest) {
    return;
  }

  try {
    await tmp.initialize();

    if (tmp.storage.installed) {
      debug('[bg] fresh install, showing options');
      browser.tabs.create({
        url: browser.runtime.getURL('options.html?installed')
      });
    }
  } catch (error) {
    browser.browserAction.onClicked.addListener(() => {
      browser.tabs.create({
        url: browser.runtime.getURL(`
          options.html?error=${encodeURIComponent(error.toString())}
        `)
      });
    });
    browser.browserAction.setPopup({
      popup: null
    });
    browser.browserAction.setTitle({title: 'Temporary Containers Error'});
    browser.browserAction.setBadgeBackgroundColor({
      color: 'red'
    });
    browser.browserAction.setBadgeText({
      text: 'E'
    });
    browser.browserAction.enable();

    window.eventListeners.remove();
  }
})();