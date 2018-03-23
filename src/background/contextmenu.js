class ContextMenu {
  constructor(background) {
    this.background = background;
  }


  initialize() {
    this.storage = this.background.storage;
    this.container = this.background.container;

    browser.contextMenus.onClicked.addListener(this.onClicked.bind(this));
    browser.windows.onFocusChanged.addListener(this.windowsOnFocusChanged.bind(this));

    this.add();
  }


  async onClicked(info, tab) {
    switch (info.menuItemId)  {
    case 'open-link-in-new-temporary-container-tab':
      this.container.createTabInTempContainer({
        tab,
        url: info.linkUrl,
        active: false,
        deletesHistory: this.storage.local.preferences.deletesHistory.automaticMode === 'automatic'
      });
      break;
    case 'open-link-in-new-deletes-history-temporary-container-tab':
      this.container.createTabInTempContainer({
        tab,
        url: info.linkUrl,
        active: false,
        deletesHistory: true
      });
      break;
    }
  }


  async add() {
    if (this.storage.local.preferences.contextMenu) {
      browser.contextMenus.create({
        id: 'open-link-in-new-temporary-container-tab',
        title: 'Open Link in New Temporary Container Tab',
        contexts: ['link'],
        icons: {
          '16': 'icons/page-w-16.svg',
          '32': 'icons/page-w-32.svg'
        }
      });
    }
    if (this.storage.local.preferences.deletesHistory.contextMenu) {
      browser.contextMenus.create({
        id: 'open-link-in-new-deletes-history-temporary-container-tab',
        title: 'Open Link in New "Deletes History Temporary Container" Tab',
        contexts: ['link'],
        icons: {
          '16': 'icons/page-w-16.svg',
          '32': 'icons/page-w-32.svg'
        }
      });
    }
  }


  async remove() {
    browser.contextMenus.removeAll();
  }


  async windowsOnFocusChanged(windowId) {
    if (windowId === browser.windows.WINDOW_ID_NONE) {
      return;
    }
    this.remove();
    try {
      const activeTab = await browser.tabs.query({
        windowId: windowId
      });
      if (!activeTab[0].incognito) {
        this.add();
      }
    } catch (error) {
      debug('failed to get the active tab from window');
    }
  }
}

window.ContextMenu = ContextMenu;