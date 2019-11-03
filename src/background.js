import './background/lib';
import './background/log';
import eventListeners from './background/event-listeners';
import BrowserAction from './background/browseraction';
import Commands from './background/commands';
import Container from './background/container';
import ContextMenu from './background/contextmenu';
import Cookies from './background/cookies';
import Isolation from './background/isolation';
import MultiAccountContainers from './background/mac';
import Management from './background/management';
import Migration from './background/migration';
import MouseClick from './background/mouseclick';
import PageAction from './background/pageaction';
import Preferences from './background/preferences.js';
import TmpRequest from './background/request';
import Runtime from './background/runtime';
import Statistics from './background/statistics';
import TmpStorage from './background/storage';
import Tabs from './background/tabs';
import Utils from './background/utils';

class TemporaryContainers {
  constructor() {
    this.initialized = false;
    debug('[tmp] initializing');

    this.utils = new Utils(this);
    this.preferences = new Preferences(this);
    this.storage = new TmpStorage(this);

    this.runtime = new Runtime(this);
    this.management = new Management(this);
    this.request = new TmpRequest(this);
    this.container = new Container(this);
    this.mouseclick = new MouseClick(this);
    this.tabs = new Tabs(this);
    this.commands = new Commands(this);
    this.browseraction = new BrowserAction(this);
    this.pageaction = new PageAction(this);
    this.contextmenu = new ContextMenu(this);
    this.cookies = new Cookies(this);
    this.isolation = new Isolation(this);
    this.statistics = new Statistics(this);
    this.mac = new MultiAccountContainers(this);
    this.migration = new Migration(this);

    this.containerPrefix = 'firefox';
  }

  async initialize() {
    this.version = browser.runtime.getManifest().version;
    this.browserVersion = parseInt(
      (await browser.runtime.getBrowserInfo()).version
    );
    const { permissions } = await browser.permissions.getAll();
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
    eventListeners.tmpInitialized(true);
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
        url: browser.runtime.getURL('options.html?installed'),
      });
    }
  } catch (error) {
    browser.browserAction.onClicked.addListener(() => {
      browser.tabs.create({
        url: browser.runtime.getURL(`
          options.html?error=${encodeURIComponent(error.toString())}
        `),
      });
    });
    browser.browserAction.setPopup({
      popup: null,
    });
    browser.browserAction.setTitle({ title: 'Temporary Containers Error' });
    browser.browserAction.setBadgeBackgroundColor({
      color: 'red',
    });
    browser.browserAction.setBadgeText({
      text: 'E',
    });
    browser.browserAction.enable();

    eventListeners.remove();
  }
})();
