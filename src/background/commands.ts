import { TemporaryContainers } from './tmp';
import { Container } from './container';
import { Storage } from './storage';
import { Tabs } from './tabs';
import { PreferencesSchema, Tab, Permissions, Debug } from '~/types';

export class Commands {
  private background: TemporaryContainers;
  private debug: Debug;
  private pref!: PreferencesSchema;
  private storage!: Storage;
  private container!: Container;
  private permissions!: Permissions;
  private tabs!: Tabs;

  constructor(background: TemporaryContainers) {
    this.background = background;
    this.debug = background.debug;
  }

  public initialize(): void {
    this.pref = this.background.pref;
    this.storage = this.background.storage;
    this.container = this.background.container;
    this.permissions = this.background.permissions;
    this.tabs = this.background.tabs;
    this.pageaction = this.background.pageaction;
  }

  public async onCommand(name: string): Promise<void> {
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
          const tab = (await browser.tabs.create({
            url: 'about:blank',
          })) as Tab;
          this.container.noContainerTabs[tab.id] = true;
          this.debug(
            '[onCommand] new no container tab created',
            this.container.noContainerTabs
          );
        } catch (error) {
          this.debug('[onCommand] couldnt create tab', error);
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
          if (!browserWindow.tabs) {
            return;
          }
          const [tab] = browserWindow.tabs as Tab[];
          this.container.noContainerTabs[tab.id] = true;
          this.debug(
            '[onCommand] new no container tab created in window',
            browserWindow,
            this.container.noContainerTabs
          );
        } catch (error) {
          this.debug('[onCommand] couldnt create tab in window', error);
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
        const [activeTab] = (await browser.tabs.query({
          currentWindow: true,
          active: true,
        })) as Tab[];
        if (!activeTab || !activeTab.url.startsWith('http')) {
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
