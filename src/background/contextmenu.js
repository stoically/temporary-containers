class ContextMenu {
  constructor(background) {
    this.background = background;

    this.nextMenuInstanceId = 0;
    this.lastMenuInstanceId = 0;
  }


  initialize() {
    this.pref = this.background.pref;
    this.storage = this.background.storage;
    this.container = this.background.container;

    browser.contextMenus.onClicked.addListener(this.onClicked.bind(this));
    browser.contextMenus.onShown.addListener(this.onShown.bind(this));
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
        deletesHistory: this.pref.deletesHistory.automaticMode === 'automatic'
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

    case 'open-bookmark-in-new-temporary-container-tab': {
      const bookmarks = await browser.bookmarks.get(info.bookmarkId);
      if (bookmarks[0].url) {
        this.container.createTabInTempContainer({
          tab,
          url: bookmarks[0].url,
          active: false,
          deletesHistory: this.pref.deletesHistory.automaticMode === 'automatic'
        });
      }
      break;
    }

    case 'open-bookmark-in-new-deletes-history-temporary-container-tab': {
      const bookmarks = await browser.bookmarks.get(info.bookmarkId);
      if (bookmarks[0].url) {
        this.container.createTabInTempContainer({
          tab,
          url: bookmarks[0].url,
          active: false,
          deletesHistory: true
        });
      }
      break;
    }}
  }


  async onShown(info) {
    if (!info.bookmarkId) {
      return;
    }
    const menuInstanceId = this.nextMenuInstanceId++;
    this.lastMenuInstanceId = menuInstanceId;

    const bookmarks = await browser.bookmarks.get(info.bookmarkId);
    if (bookmarks[0].url) {
      return;
    }

    await this.toggleBookmarks(false);

    if (menuInstanceId !== this.lastMenuInstanceId) {
      this.toggleBookmarks(true);
      return;
    }
    await browser.contextMenus.refresh();
    this.toggleBookmarks(true);
  }


  async toggleBookmarks(visible) {
    if (this.pref.contextMenuBookmarks &&
      this.background.permissions.bookmarks) {
      await browser.contextMenus.update('open-bookmark-in-new-temporary-container-tab', {
        visible
      });
    }
    if (this.pref.deletesHistory.contextMenuBookmarks &&
      this.background.permissions.history &&
      this.background.permissions.bookmarks) {
      await browser.contextMenus.update('open-bookmark-in-new-deletes-history-temporary-container-tab', {
        visible
      });
    }
  }


  async add() {
    if (this.pref.contextMenu) {
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
    if (this.pref.deletesHistory.contextMenu &&
      this.background.permissions.history) {
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
    if (this.pref.contextMenuBookmarks &&
      this.background.permissions.bookmarks) {
      browser.contextMenus.create({
        id: 'open-bookmark-in-new-temporary-container-tab',
        title: 'Open Bookmark in New Temporary Container Tab',
        contexts: ['bookmark'],
        icons: {
          '16': 'icons/page-w-16.svg',
          '32': 'icons/page-w-32.svg'
        }
      });
    }
    if (this.pref.deletesHistory.contextMenuBookmarks &&
      this.background.permissions.history &&
      this.background.permissions.bookmarks) {
      browser.contextMenus.create({
        id: 'open-bookmark-in-new-deletes-history-temporary-container-tab',
        title: 'Open Bookmark in New "Deletes History Temporary Container" Tab',
        contexts: ['bookmark'],
        icons: {
          '16': 'icons/page-w-16.svg',
          '32': 'icons/page-w-32.svg'
        }
      });
    }
  }


  remove() {
    return browser.contextMenus.removeAll();
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