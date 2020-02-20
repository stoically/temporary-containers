import { TemporaryContainers } from './tmp';
import { BrowserAction } from './browseraction';
import { Cleanup } from './cleanup';
import { Container } from './container';
import { History } from './history';
import { delay } from './lib';
import { MultiAccountContainers } from './mac';
import { PageAction } from './pageaction';
import { PreferencesSchema, Tab, Debug, CookieStoreId, TabId } from '~/types';
import { Scripts } from './scripts';

export class Tabs {
  public creatingInSameContainer = false;
  public containerMap = new Map();
  public containerTabs: Map<CookieStoreId, Set<TabId>> = new Map();

  private background: TemporaryContainers;
  private debug: Debug;
  private pref!: PreferencesSchema;
  private container!: Container;
  private browseraction!: BrowserAction;
  private pageaction!: PageAction;
  private mac!: MultiAccountContainers;
  private history!: History;
  private cleanup!: Cleanup;
  private scripts!: Scripts;

  constructor(background: TemporaryContainers) {
    this.background = background;
    this.debug = background.debug;
  }

  async initialize(): Promise<void> {
    this.pref = this.background.pref;
    this.container = this.background.container;
    this.browseraction = this.background.browseraction;
    this.pageaction = this.background.pageaction;
    this.mac = this.background.mac;
    this.history = this.background.history;
    this.cleanup = this.background.cleanup;

    const tabs = (await browser.tabs.query({})) as Tab[];
    tabs.forEach(tab => this.registerTab(tab));
  }

  // onUpdated sometimes (often) fires before onCreated
  // https://bugzilla.mozilla.org/show_bug.cgi?id=1586612
  async onCreated(tab: Tab): Promise<void> {
    this.debug('[onCreated] tab created', tab);
    this.registerTab(tab);
    const reopened = await this.maybeReopenInTmpContainer(tab);
    if (!reopened) {
      this.maybeMoveTab(tab);
    }
  }

  async onUpdated(
    tabId: number,
    changeInfo: browser.tabs.TabsOnUpdatedEventChangeInfo,
    tab: Tab
  ): Promise<void> {
    this.debug('[onUpdated] tab updated', tab, changeInfo);
    this.maybeCloseRedirectorTab(tab, changeInfo);

    if (changeInfo.url) {
      this.debug('[onUpdated] url changed', changeInfo);
      this.history.maybeAddHistory(tab, changeInfo.url);
      const reopened = await this.maybeReopenInTmpContainer(tab);
      if (!reopened) {
        this.pageaction.showOrHide(tab);
      }
    }
  }

  async onRemoved(tabId: number): Promise<void> {
    this.debug('[onRemoved]', tabId);

    if (this.container.noContainerTabs[tabId]) {
      delete this.container.noContainerTabs[tabId];
    }
    if (this.container.tabCreatedAsMacConfirmPage[tabId]) {
      delete this.container.tabCreatedAsMacConfirmPage[tabId];
    }

    const tmpCookieStoreId = this.containerMap.get(tabId);
    if (tmpCookieStoreId) {
      this.unregisterTab(tabId, tmpCookieStoreId);

      this.debug(
        '[onRemoved] queuing container removal because of tab removal',
        tabId
      );
      this.cleanup.addToRemoveQueue(tmpCookieStoreId);
    }
  }

  async onActivated(
    activeInfo: browser.tabs.onActivatedActiveInfo
  ): Promise<void> {
    this.debug('[onActivated]', activeInfo);
    delete this.container.lastCreatedInactiveTab[
      browser.windows.WINDOW_ID_CURRENT
    ];
    const activatedTab = (await browser.tabs.get(activeInfo.tabId)) as Tab;
    this.pageaction.showOrHide(activatedTab);
  }

  registerTab(tab: Tab): void {
    if (!this.container.isTemporary(tab.cookieStoreId)) {
      return;
    }
    this.containerMap.set(tab.id, tab.cookieStoreId);

    const containerTabs = this.containerTabs.get(tab.cookieStoreId);
    if (containerTabs) {
      containerTabs.add(tab.id);
    } else {
      this.containerTabs.set(tab.cookieStoreId, new Set([tab.id]));
    }
  }

  unregisterTab(tabId: TabId, cookieStoreId: CookieStoreId): void {
    const containerTabs = this.containerTabs.get(cookieStoreId);
    if (containerTabs) {
      containerTabs.delete(tabId);
      if (!containerTabs.size) {
        this.containerTabs.delete(cookieStoreId);
      }
    }
    this.containerMap.delete(tabId);
  }

  async handleAlreadyOpen(): Promise<(void | boolean)[]> {
    const tabs = (await browser.tabs.query({})) as Tab[];
    return Promise.all(tabs.map(tab => this.maybeReopenInTmpContainer(tab)));
  }

  async maybeReopenInTmpContainer(tab: Tab): Promise<void | boolean> {
    if (this.creatingInSameContainer) {
      this.debug(
        '[maybeReopenInTmpContainer] we are in the process of creating a tab in same container, ignore',
        tab
      );
      return;
    }

    if (this.container.noContainerTabs[tab.id]) {
      this.debug('[maybeReopenInTmpContainer] nocontainer tab, ignore', tab);
      return;
    }

    if (tab.url.startsWith('moz-extension://')) {
      this.debug('[maybeReopenInTmpContainer] moz-extension url', tab);
      await this.mac.handleConfirmPage(tab);
      return;
    }

    if (!this.pref.automaticMode.active) {
      this.debug(
        '[maybeReopenInTmpContainer] automatic mode not active, we ignore that',
        tab
      );
      return;
    }

    if (tab.url !== 'about:home' && tab.url !== 'about:newtab') {
      this.debug(
        '[maybeReopenInTmpContainer] not a home/new tab, we dont handle that',
        tab
      );
      return;
    }

    const deletesHistory =
      this.pref.deletesHistory.automaticMode === 'automatic';

    if (tab.cookieStoreId === `${this.background.containerPrefix}-default`) {
      if (this.pref.automaticMode.newTab === 'navigation' && !deletesHistory) {
        this.debug(
          '[maybeReopenInTmpContainer] automatic mode on navigation, setting icon badge',
          tab
        );
        this.browseraction.addBadge(tab.id);
        return;
      }

      if (this.pref.automaticMode.newTab === 'created' || deletesHistory) {
        this.debug(
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
      this.container.isTemporary(tab.cookieStoreId) &&
      this.pref.automaticMode.newTab === 'navigation'
    ) {
      this.debug(
        '[maybeReopenInTmpContainer] about:home and automatic mode on navigation but already in tmp container, open in default container',
        tab
      );
      await browser.tabs.create({
        cookieStoreId: `${this.background.containerPrefix}-default`,
      });
      await this.remove(tab);
      this.browseraction.addBadge(tab.id);
      return true;
    }
  }

  async maybeCloseRedirectorTab(
    tab: Tab,
    changeInfo: browser.tabs.TabsOnUpdatedEventChangeInfo
  ): Promise<void> {
    if (
      !this.pref.closeRedirectorTabs.active ||
      changeInfo.status !== 'complete'
    ) {
      return;
    }

    const url = new URL(tab.url);
    if (!this.pref.closeRedirectorTabs.domains.includes(url.hostname)) {
      return;
    }

    await delay(this.pref.closeRedirectorTabs.delay);

    // check the tab url again to make sure the tab didn't change its url
    const redirTab = (await browser.tabs.get(tab.id)) as Tab;
    const redirUrl = new URL(redirTab.url);
    if (!this.pref.closeRedirectorTabs.domains.includes(redirUrl.hostname)) {
      return;
    }

    this.debug('[onUpdated] removing redirector tab', changeInfo, redirTab);
    this.remove(redirTab);
  }

  async maybeMoveTab(tab: Tab): Promise<void> {
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
          this.debug('[onCreated] moving tab', lastCreatedInactiveTab, tab);
          browser.tabs.move(tab.id, { index: lastCreatedInactiveTab.index });
          this.container.lastCreatedInactiveTab[
            browser.windows.WINDOW_ID_CURRENT
          ] = tab.id;
        }
      } catch (error) {
        this.debug('[onCreated] getting lastCreatedInactiveTab failed', error);
      }
    }
  }

  async createInSameContainer(): Promise<void> {
    this.creatingInSameContainer = true;
    try {
      const tabs = await browser.tabs.query({
        active: true,
        currentWindow: true,
      });
      const activeTab = tabs[0];
      if (!activeTab) {
        this.debug(
          '[createInSameContainer] couldnt find an active tab',
          activeTab
        );
        return;
      }
      try {
        const newTab = await browser.tabs.create({
          index: activeTab.index + 1,
          cookieStoreId: activeTab.cookieStoreId,
        });
        this.debug(
          '[createInSameContainer] new same container tab created',
          activeTab,
          newTab
        );
      } catch (error) {
        this.debug('[createInSameContainer] couldnt create tab', error);
      }
    } catch (error) {
      this.debug('[createInSameContainer] couldnt query tabs', error);
    }
    this.creatingInSameContainer = false;
  }

  async remove(tab: Tab): Promise<void> {
    try {
      await browser.tabs.remove(tab.id);
    } catch (error) {
      this.debug('[remove] couldnt remove tab', error, tab);
    }
  }
}
