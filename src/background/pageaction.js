class PageAction {
  constructor(background) {
    this.background = background;
  }

  initialize() {
    this.pref = this.background.pref;
    this.storage = this.background.storage;
  }

  async showOrHide(activatedTab) {
    if (!activatedTab) {
      const [activeTab] = await browser.tabs.query({
        currentWindow: true,
        active: true,
      });
      activatedTab = activeTab;
    }

    let color;
    if (
      activatedTab.cookieStoreId ===
      `${this.background.containerPrefix}-default`
    ) {
      color = 'gray';
    } else if (
      this.storage.local.tempContainers[activatedTab.cookieStoreId] &&
      this.storage.local.tempContainers[activatedTab.cookieStoreId].color
    ) {
      color = this.storage.local.tempContainers[activatedTab.cookieStoreId]
        .color;
    } else {
      const container = await browser.contextualIdentities.get(
        activatedTab.cookieStoreId
      );
      color = container.color;
    }
    browser.pageAction.setIcon({
      path: {
        '19': `icons/pageaction-${color}-19.svg`,
        '38': `icons/pageaction-${color}-38.svg`,
      },
      tabId: activatedTab.id,
    });
    if (!this.pref.pageAction) {
      browser.pageAction.hide(activatedTab.id);
    } else {
      browser.pageAction.show(activatedTab.id);
    }
  }
}

export default PageAction;
