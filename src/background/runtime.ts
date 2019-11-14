import { TemporaryContainers } from './tmp';
import { BrowserAction } from './browseraction';
import { Cleanup } from './cleanup';
import { Container } from './container';
import { ContextMenu } from './contextmenu';
import { Convert } from './convert';
import { Migration } from './migration';
import { MouseClick } from './mouseclick';
import { Preferences } from './preferences';
import { Storage } from './storage';
import { Utils } from './utils';
import { PreferencesSchema, Tab, Debug, RuntimeMessage } from '~/types';

export class Runtime {
  private background: TemporaryContainers;
  private debug: Debug;
  private storage: Storage;
  private pref!: PreferencesSchema;
  private preferences!: Preferences;
  private container!: Container;
  private mouseclick!: MouseClick;
  private browseraction!: BrowserAction;
  private migration!: Migration;
  private contextmenu!: ContextMenu;
  private cleanup!: Cleanup;
  private convert!: Convert;
  private utils!: Utils;

  constructor(background: TemporaryContainers) {
    this.background = background;
    this.debug = background.debug;
    this.storage = background.storage;
  }

  public initialize(): void {
    this.pref = this.background.pref;
    this.preferences = this.background.preferences;
    this.container = this.background.container;
    this.mouseclick = this.background.mouseclick;
    this.browseraction = this.background.browseraction;
    this.migration = this.background.migration;
    this.contextmenu = this.background.contextmenu;
    this.cleanup = this.background.cleanup;
    this.convert = this.background.convert;
    this.utils = this.background.utils;
  }

  public async onMessage(
    message: RuntimeMessage,
    sender: browser.runtime.MessageSender
  ): Promise<void | boolean | Tab | 'pong'> {
    this.debug('[onMessage] message received', message, sender);
    if (typeof message !== 'object') {
      return;
    }

    switch (message.method) {
      case 'linkClicked':
        this.debug('[onMessage] link clicked');
        this.mouseclick.linkClicked(message.payload, sender);
        break;

      case 'savePreferences':
        this.debug('[onMessage] saving preferences');
        await this.preferences.handleChanges({
          oldPreferences: this.pref,
          newPreferences: message.payload.preferences,
        });
        this.storage.local.preferences = message.payload.preferences;
        await this.storage.persist();

        if (
          (
            await browser.tabs.query({
              url: browser.runtime.getURL('options.html'),
            })
          ).length
        ) {
          browser.runtime.sendMessage({
            info: 'preferencesUpdated',
            fromTabId: sender && sender.tab && sender.tab.id,
          });
        }
        break;

      case 'importPreferences': {
        const oldPreferences = this.utils.clone(this.storage.local.preferences);
        if (
          this.background.utils.addMissingKeys({
            defaults: this.preferences.defaults,
            source: message.payload.preferences,
          })
        ) {
          await this.storage.persist();
        }
        await this.migration.migrate({
          preferences: message.payload.preferences,
          previousVersion: message.payload.previousVersion,
        });
        await this.preferences.handleChanges({
          oldPreferences,
          newPreferences: this.pref,
        });
        break;
      }

      case 'resetStatistics':
        this.debug('[onMessage] resetting statistics');
        this.storage.local.statistics = this.utils.clone(
          this.storage.defaults.statistics
        );
        this.storage.local.statistics.startTime = new Date();
        await this.storage.persist();
        break;

      case 'resetStorage':
        this.debug('[onMessage] resetting storage', message, sender);
        this.browseraction.unsetPopup();
        this.contextmenu.remove();
        this.browseraction.setIcon('default');
        await browser.storage.local.clear();
        return this.storage.install();

      case 'resetContainerNumber':
        this.debug('[onMessage] resetting container number', message, sender);
        this.storage.local.tempContainerCounter = 0;
        await this.storage.persist();
        break;

      case 'createTabInTempContainer':
        return this.container.createTabInTempContainer({
          url: message.payload ? message.payload.url : undefined,
          deletesHistory: message.payload
            ? message.payload.deletesHistory
            : undefined,
        });

      case 'convertTempContainerToPermanent':
        return this.convert.convertTempContainerToPermanent({
          cookieStoreId: message.payload.cookieStoreId,
          tabId: message.payload.tabId,
          name: message.payload.name,
        });

      case 'convertTempContainerToRegular':
        return this.convert.convertTempContainerToRegular({
          cookieStoreId: message.payload.cookieStoreId,
          tabId: message.payload.tabId,
        });

      case 'convertPermanentToTempContainer':
        return this.convert.convertPermanentToTempContainer({
          cookieStoreId: message.payload.cookieStoreId,
          tabId: message.payload.tabId,
        });

      case 'lastFileExport':
        this.storage.local.lastFileExport = message.payload.lastFileExport;
        return this.storage.persist();

      case 'ping':
        return 'pong';
    }
  }

  public async onMessageExternal(
    message: {
      method: string;
      url?: string;
      active?: boolean;
      cookieStoreId?: string;
    },
    sender: browser.runtime.MessageSender
  ): Promise<undefined | boolean | Tab> {
    this.debug('[onMessageExternal] got external message', message, sender);
    switch (message.method) {
      case 'createTabInTempContainer':
        return this.container.createTabInTempContainer({
          url: message.url || undefined,
          active: message.active,
          deletesHistory:
            this.pref.deletesHistory.automaticMode === 'automatic'
              ? true
              : false,
        });
      case 'isTempContainer':
        return message.cookieStoreId &&
          this.storage.local.tempContainers[message.cookieStoreId]
          ? true
          : false;
      default:
        throw new Error('Unknown message.method');
    }
  }

  public async onStartup(): Promise<void> {
    this.cleanup.cleanup(true);

    if (this.pref.container.numberMode === 'keepuntilrestart') {
      this.storage.local.tempContainerCounter = 0;
      this.storage.persist();
    }
  }
}
