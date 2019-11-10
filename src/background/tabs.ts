import { TemporaryContainers } from '../background';
import { BrowserAction } from './browseraction';
import { Cleanup } from './cleanup';
import { Container } from './container';
import { History } from './history';
import { delay } from './lib';
import { debug } from './log';
import { MultiAccountContainers } from './mac';
import { PageAction } from './pageaction';
import { IPreferences } from './preferences';

export type TabId = number;
export type WindowId = number;

export class Tabs {
  public creatingInSameContainer = false;
  public containerMap = new Map();

  private background: TemporaryContainers;
  private pref!: IPreferences;
  private container!: Container;
  private browseraction!: BrowserAction;
  private pageaction!: PageAction;
  private mac!: MultiAccountContainers;
  private history!: History;
  private cleanup!: Cleanup;
  private tabs!: Tabs;

  constructor(background: TemporaryContainers) {
    this.background = background;
  }

  public initialize() {
    this.pref = this.background.pref;
    this.container = this.background.container;
    this.browseraction = this.background.browseraction;
    this.pageaction = this.background.pageaction;
    this.mac = this.background.mac;
    this.history = this.background.history;
    this.cleanup = this.background.cleanup;
    this.tabs = this.background.tabs;

    return this.handleAlreadyOpen();
  }

  // onUpdated sometimes (often) fires before onCreated
  // https://bugzilla.mozilla.org/show_bug.cgi?id=1586612
  public async onCreated(tab: browser.tabs.Tab) {
    debug('[onCreated] tab created', tab);
    this.containerMap.set(tab.id, tab.cookieStoreId);
    const reopened = await this.maybeReopenInTmpContainer(tab);
    if (!reopened) {
      this.maybeMoveTab(tab);
    }
  }

  public async onUpdated(
    tabId: number,
    changeInfo: any,
    tab: browser.tabs.Tab
  ) {
    debug('[onUpdated] tab updated', tab, changeInfo);
    this.maybeCloseRedirectorTab(tab, changeInfo);

    if (changeInfo.url) {
      debug('[onUpdated] url changed', changeInfo);
      this.history.maybeAddHistory(tab, changeInfo.url);
      const reopened = await this.maybeReopenInTmpContainer(tab);
      if (!reopened) {
        this.pageaction.showOrHide(tab);
      }
    }
  }

  public async onRemoved(tabId: number) {
    debug('[onRemoved]', tabId);

    if (this.container.noContainerTabs[tabId]) {
      delete this.container.noContainerTabs[tabId];
    }
    if (this.container.tabCreatedAsMacConfirmPage[tabId]) {
      delete this.container.tabCreatedAsMacConfirmPage[tabId];
    }

    const cookieStoreId = this.containerMap.get(tabId);
    if (cookieStoreId && this.container.isTemporary(cookieStoreId)) {
      debug(
        '[onRemoved] queuing container removal because of tab removal',
        tabId
      );
      delay(2000).then(() => this.cleanup.addToRemoveQueue(cookieStoreId));
    }

    this.containerMap.delete(tabId);
  }

  public async onActivated(activeInfo: any) {
    debug('[onActivated]', activeInfo);
    delete this.container.lastCreatedInactiveTab[
      browser.windows.WINDOW_ID_CURRENT
    ];
    const activatedTab = await browser.tabs.get(activeInfo.tabId);
    this.pageaction.showOrHide(activatedTab);
  }

  async handleAlreadyOpen() {
    const tabs = await browser.tabs.query({});
    return Promise.all(tabs.map(tab => this.maybeReopenInTmpContainer(tab)));
  }

  async maybeReopenInTmpContainer(tab: browser.tabs.Tab) {
    if (this.creatingInSameContainer) {
      debug(
        '[maybeReopenInTmpContainer] we are in the process of creating a tab in same container, ignore',
        tab
      );
      return;
    }

    if (this.container.noContainerTabs[tab.id!]) {
      debug('[maybeReopenInTmpContainer] nocontainer tab, ignore', tab);
      return;
    }

    if (tab.url!.startsWith('moz-extension://')) {
      debug('[maybeReopenInTmpContainer] moz-extension url', tab);
      await this.mac.handleConfirmPage(tab);
      return;
    }

    if (!this.pref.automaticMode.active) {
      debug(
        '[maybeReopenInTmpContainer] automatic mode not active, we ignore that',
        tab
      );
      return;
    }

    if (tab.url !== 'about:home' && tab.url !== 'about:newtab') {
      debug(
        '[maybeReopenInTmpContainer] not a home/new tab, we dont handle that',
        tab
      );
      return;
    }

    const deletesHistory =
      this.pref.deletesHistory.automaticMode === 'automatic';

    if (tab.cookieStoreId === `${this.background.containerPrefix}-default`) {
      if (this.pref.automaticMode.newTab === 'navigation' && !deletesHistory) {
        debug(
          '[maybeReopenInTmpContainer] automatic mode on navigation, setting icon badge',
          tab
        );
        this.browseraction.addBadge(tab.id!);
        return;
      }

      if (this.pref.automaticMode.newTab === 'created' || deletesHistory) {
        debug(
          '[maybeReopenInTmpContainer] about:home/new tab in firefox-default container, reload in temp container',
          tab
        );
        await this.container.reloadTabInTempContainer({
          tab,
          deletesHistory,
        });
        return true;
      }
    }

    if (
      tab.url === 'about:home' &&
      this.container.isTemporary(tab.cookieStoreId!) &&
      this.pref.automaticMode.newTab === 'navigation'
    ) {
      debug(
        '[maybeReopenInTmpContainer] about:home and automatic mode on navigation but already in tmp container, open in default container',
        tab
      );
      await browser.tabs.create({
        cookieStoreId: `${this.background.containerPrefix}-default`,
      });
      await this.remove(tab);
      this.browseraction.addBadge(tab.id!);
      return true;
    }
  }

  public maybeCloseRedirectorTab(tab: browser.tabs.Tab, changeInfo: any) {
    if (
      this.pref.closeRedirectorTabs.active &&
      changeInfo.status &&
      changeInfo.status === 'complete'
    ) {
      const url = new URL(tab.url!);
      if (this.pref.closeRedirectorTabs.domains.includes(url.hostname)) {
        delay(this.pref.closeRedirectorTabs.delay).then(async () => {
          debug('[onUpdated] removing redirector tab', changeInfo, tab);
          this.tabs.remove(tab);
        });
      }
    }
  }

  public async maybeMoveTab(tab: browser.tabs.Tab) {
    if (
      !tab.active &&
      this.container.lastCreatedInactiveTab[
        browser.windows.WINDOW_ID_CURRENT
      ] &&
      this.container.lastCreatedInactiveTab[
        browser.windows.WINDOW_ID_CURRENT
      ] !== tab.id
    ) {
      try {
        const lastCreatedInactiveTab = await browser.tabs.get(
          this.container.lastCreatedInactiveTab[
            browser.windows.WINDOW_ID_CURRENT
          ]
        );
        if (lastCreatedInactiveTab.index > tab.index) {
          debug('[onCreated] moving tab', lastCreatedInactiveTab, tab);
          browser.tabs.move(tab.id!, { index: lastCreatedInactiveTab.index });
          this.container.lastCreatedInactiveTab[
            browser.windows.WINDOW_ID_CURRENT
          ] = tab.id!;
        }
      } catch (error) {
        debug('[onCreated] getting lastCreatedInactiveTab failed', error);
      }
    }
  }

  async createInSameContainer() {
    this.creatingInSameContainer = true;
    try {
      const tabs = await browser.tabs.query({
        active: true,
        currentWindow: true,
      });
      const activeTab = tabs[0];
      if (!activeTab) {
        debug('[createInSameContainer] couldnt find an active tab', activeTab);
        return;
      }
      try {
        const newTab = await browser.tabs.create({
          index: activeTab.index + 1,
          cookieStoreId: activeTab.cookieStoreId,
        });
        debug(
          '[createInSameContainer] new same container tab created',
          activeTab,
          newTab
        );
      } catch (error) {
        debug('[createInSameContainer] couldnt create tab', error);
      }
    } catch (error) {
      debug('[createInSameContainer] couldnt query tabs', error);
    }
    this.creatingInSameContainer = false;
  }

  public async remove(tab: browser.tabs.Tab) {
    try {
      // make sure we dont close the window by removing this tab
      // TODO implement actual queue for removal, race-condition (and with that window-closing) is possible
      const tabs = await browser.tabs.query({
        windowId: browser.windows.WINDOW_ID_CURRENT,
      });
      if (tabs.length > 1) {
        try {
          await browser.tabs.remove(tab.id!);
          debug('[removeTab] removed old tab', tab.id);
        } catch (error) {
          debug('[removeTab] error while removing old tab', tab, error);
        }
      } else {
        debug(
          '[removeTab] queuing removal of tab to prevent closing of window',
          tab,
          tabs
        );
        delay(500).then(() => {
          this.remove(tab);
        });
      }
    } catch (error) {
      debug('[removeTab] couldnt query tabs', tab, error);
    }
  }
}
