import { Log } from './log';
import { EventListeners } from './event-listeners';
import { BrowserAction } from './browseraction';
import { Cleanup } from './cleanup';
import { Commands } from './commands';
import { Container } from './container';
import { ContextMenu } from './contextmenu';
import { Convert } from './convert';
import { Cookies } from './cookies';
import { History } from './history';
import { Isolation } from './isolation';
import { MultiAccountContainers } from './mac';
import { Management } from './management';
import { Migration } from './migration';
import { MigrationLegacy } from './migration-legacy';
import { MouseClick } from './mouseclick';
import { PageAction } from './pageaction';
import { Preferences } from './preferences';
import { Request } from './request';
import { Runtime } from './runtime';
import { Statistics } from './statistics';
import { Storage } from './storage';
import { Tabs } from './tabs';
import { Utils } from './utils';
import { PreferencesSchema, Permissions } from '~/types';

export class TemporaryContainers {
  public initialized = false;
  public log = new Log();
  public debug = this.log.debug;
  public utils = new Utils(this);
  public preferences = new Preferences(this);
  public storage = new Storage(this);
  public runtime = new Runtime(this);
  public management = new Management(this);
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
  public migrationLegacy = new MigrationLegacy(this);
  public eventlisteners = new EventListeners(this);

  public version!: string;
  public containerPrefix = 'firefox';
  public permissions!: Permissions;
  public pref!: PreferencesSchema;

  public async initialize(): Promise<TemporaryContainers> {
    if (this.initialized) {
      throw new Error('already initialized');
    }

    this.debug('[tmp] initializing');
    browser.browserAction.disable();
    this.version = browser.runtime.getManifest().version;
    const { permissions } = await browser.permissions.getAll();
    if (!permissions) {
      throw new Error('permissions.getAll() failed');
    }
    this.permissions = {
      bookmarks: permissions.includes('bookmarks'),
      history: permissions.includes('history'),
      notifications: permissions.includes('notifications'),
      downloads: permissions.includes('downloads'),
    };

    this.preferences.initialize();
    await this.storage.initialize();

    this.pref = (new Proxy(this.storage, {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      get(target, key): any {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    this.tabs.initialize();

    await this.management.initialize();

    this.debug('[tmp] initialized');
    this.initialized = true;
    this.eventlisteners.tmpInitialized();
    browser.browserAction.enable();

    await this.tabs.handleAlreadyOpen();

    return this;
  }
}
