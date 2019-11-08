import { IPermissions, TemporaryContainers } from '../background';
import { Container } from './container';
import { debug } from './log';
import { IPreferences } from './preferences';
import { Storage } from './storage';
import { Tabs } from './tabs';

export class Commands {
  private background: TemporaryContainers;
  private pref!: IPreferences;
  private storage!: Storage;
  private container!: Container;
  private permissions!: IPermissions;
  private tabs!: Tabs;

  constructor(background: TemporaryContainers) {
    this.background = background;
  }

  public initialize() {
    this.pref = this.background.pref;
    this.storage = this.background.storage;
    this.container = this.background.container;
    this.permissions = this.background.permissions;
    this.tabs = this.background.tabs;
    this.pageaction = this.background.pageaction;
  }

  public async onCommand(name: string) {
    switch (name) {
      case 'new_temporary_container_tab':
        if (!this.pref.keyboardShortcuts.AltC) {
          return;
        }
        this.container.createTabInTempContainer({
          deletesHistory:
            this.pref.deletesHistory.automaticMode === 'automatic',
        });
        break;

      case 'new_no_container_tab':
        if (!this.pref.keyboardShortcuts.AltN) {
          return;
        }
        try {
          const tab = await browser.tabs.create({
            url: 'about:blank',
          });
          this.container.noContainerTabs[tab.id!] = true;
          debug(
            '[onCommand] new no container tab created',
            this.container.noContainerTabs
          );
        } catch (error) {
          debug('[onCommand] couldnt create tab', error);
        }
        break;

      case 'new_no_container_window_tab':
        if (!this.pref.keyboardShortcuts.AltShiftC) {
          return;
        }
        try {
          const browserWindow = await browser.windows.create({
            url: 'about:blank',
          });
          this.container.noContainerTabs[browserWindow.tabs![0].id!] = true;
          debug(
            '[onCommand] new no container tab created in window',
            browserWindow,
            this.container.noContainerTabs
          );
        } catch (error) {
          debug('[onCommand] couldnt create tab in window', error);
        }
        break;

      case 'new_no_history_tab':
        if (!this.pref.keyboardShortcuts.AltP) {
          return;
        }
        if (this.permissions.history) {
          this.container.createTabInTempContainer({ deletesHistory: true });
        }
        break;

      case 'new_same_container_tab':
        if (!this.pref.keyboardShortcuts.AltX) {
          return;
        }
        this.tabs.createInSameContainer();
        break;

      case 'new_temporary_container_tab_current_url': {
        if (!this.pref.keyboardShortcuts.AltO) {
          return;
        }
        const [activeTab] = await browser.tabs.query({
          currentWindow: true,
          active: true,
        });
        if (!activeTab || !activeTab.url!.startsWith('http')) {
          return;
        }
        this.container.createTabInTempContainer({
          url: activeTab.url,
          deletesHistory:
            this.pref.deletesHistory.automaticMode === 'automatic',
        });
        break;
      }

      case 'toggle_isolation':
        if (!this.pref.keyboardShortcuts.AltI) {
          return;
        }
        this.storage.local.preferences.isolation.active = !this.pref.isolation
          .active;
        this.storage.persist();
        if (this.pref.isolation.active) {
          this.background.browseraction.removeIsolationInactiveBadge();
        } else {
          this.background.browseraction.addIsolationInactiveBadge();
        }
        this.pageaction.showOrHide();
        break;
    }
  }
}
