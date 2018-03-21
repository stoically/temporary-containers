class PageAction {
  initialize(background) {
    this.storage = background.storage;
  }

  async showOrHidePageAction(activatedTab) {
    let color;
    if (activatedTab.cookieStoreId === 'firefox-default') {
      color = 'gray';
    } else if (this.storage.local.tempContainers[activatedTab.cookieStoreId] &&
               this.storage.local.tempContainers[activatedTab.cookieStoreId].color) {
      color = this.storage.local.tempContainers[activatedTab.cookieStoreId].color;
    } else {
      const container = await browser.contextualIdentities.get(activatedTab.cookieStoreId);
      color = container.color;
    }
    browser.pageAction.setIcon({
      path: {
        '19': `icons/pageaction-${color}-19.svg`,
        '38': `icons/pageaction-${color}-38.svg`
      },
      tabId: activatedTab.id
    });
    if (!this.storage.local.preferences.pageAction ||
        !activatedTab.url.startsWith('http')) {
      browser.pageAction.hide(activatedTab.id);
    } else {
      browser.pageAction.show(activatedTab.id);
    }
  }
}

window.PageAction = PageAction;