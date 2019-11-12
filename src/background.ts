import { eventListeners } from './background/event-listeners';
import { debug } from './background/log';

import { BrowserAction } from './background/browseraction';
import { Cleanup } from './background/cleanup';
import { Commands } from './background/commands';
import { Container } from './background/container';
import { ContextMenu } from './background/contextmenu';
import { Convert } from './background/convert';
import { Cookies } from './background/cookies';
import { History } from './background/history';
import { Isolation } from './background/isolation';
import { MultiAccountContainers } from './background/mac';
import { Management } from './background/management';
import { Migration } from './background/migration';
import './background/migration-legacy';
import { MouseClick } from './background/mouseclick';
import { PageAction } from './background/pageaction';
import { Preferences } from './background/preferences';
import { Request } from './background/request';
import { Runtime } from './background/runtime';
import { Statistics } from './background/statistics';
import { Storage } from './background/storage';
import { Tabs } from './background/tabs';
import { Utils } from './background/utils';
import { PreferencesSchema } from './types';

export interface Permissions {
  history?: true | false;
  bookmarks?: true | false;
  notifications?: true | false;
}

export class TemporaryContainers {
  public initialized = false;
  public utils = new Utils();
  public preferences = new Preferences(this);
  public storage = new Storage(this);
  public runtime = new Runtime(this);
  public management = new Management();
  public request = new Request(this);
  public container = new Container(this);
  public mouseclick = new MouseClick(this);
  public tabs = new Tabs(this);
  public commands = new Commands(this);
  public browseraction = new BrowserAction(this);
  public pageaction = new PageAction(this);
  public contextmenu = new ContextMenu(this);
  public cookies = new Cookies(this);
  public isolation = new Isolation(this);
  public history = new History(this);
  public cleanup = new Cleanup(this);
  public convert = new Convert(this);
  public statistics = new Statistics(this);
  public mac = new MultiAccountContainers(this);
  public migration = new Migration(this);

  public version!: string;
  public browserVersion!: number;
  public containerPrefix = 'firefox';
  public permissions!: Permissions;
  public pref!: PreferencesSchema;

  public async initialize() {
    debug('[tmp] initializing');
    this.version = browser.runtime.getManifest().version;
    this.browserVersion = parseInt(
      (await browser.runtime.getBrowserInfo()).version,
      10
    );
    const { permissions } = await browser.permissions.getAll();
    this.permissions = {
      bookmarks: permissions?.includes('bookmarks'),
      history: permissions?.includes('history'),
      notifications: permissions?.includes('notifications'),
    };

    this.preferences.initialize();
    await this.storage.initialize();

    this.pref = (new Proxy(this.storage, {
      get(target, key) {
        return (target.local.preferences as any)[key];
      },
    }) as unknown) as PreferencesSchema;

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
    this.history.initialize();
    this.cleanup.initialize();
    this.convert.initialize();

    await this.management.initialize();
    await this.tabs.initialize();

    debug('[tmp] initialized');
    this.initialized = true;
    eventListeners.tmpInitialized();
    browser.browserAction.enable();
  }
}

browser.browserAction.disable();

const tmp = new TemporaryContainers();
(window as any).TemporaryContainers = TemporaryContainers;
(window as any).tmp = tmp;

(async () => {
  if ((window as any)._mochaTest) {
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
