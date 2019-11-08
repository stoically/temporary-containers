import { debug } from './log';

export class History {
  private background: any;
  private storage: any;

  constructor(background) {
    this.background = background;
  }

  initialize() {
    this.storage = this.background.storage;
  }

  async maybeAddHistory(tab, url) {
    if (!tab || url === 'about:blank' || url === 'about:newtab') {
      return;
    }
    if (
      tab.cookieStoreId !== `${this.background.containerPrefix}-default` &&
      this.storage.local.tempContainers[tab.cookieStoreId] &&
      this.storage.local.tempContainers[tab.cookieStoreId].deletesHistory
    ) {
      if (!this.storage.local.tempContainers[tab.cookieStoreId].history) {
        this.storage.local.tempContainers[tab.cookieStoreId].history = {};
      }
      this.storage.local.tempContainers[tab.cookieStoreId].history[url] = {
        tabId: tab.id,
      };
      await this.storage.persist();
    }
  }

  maybeClearHistory(cookieStoreId) {
    let count = 0;
    if (
      this.storage.local.tempContainers[cookieStoreId] &&
      this.storage.local.tempContainers[cookieStoreId].deletesHistory &&
      this.storage.local.tempContainers[cookieStoreId].history
    ) {
      const urls = Object.keys(
        this.storage.local.tempContainers[cookieStoreId].history
      );
      count = urls.length;
      urls.map(url => {
        if (!url) {
          return;
        }
        debug('[maybeClearHistory] removing url from history', url);
        browser.history.deleteUrl({ url });
      });
    }
    return count;
  }
}
