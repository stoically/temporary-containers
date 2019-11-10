import { TemporaryContainers } from '../background';
import { CookieStoreId } from './container';
import { debug } from './log';
import { Storage } from './storage';

export class History {
  private background: TemporaryContainers;
  private storage!: Storage;

  constructor(background: TemporaryContainers) {
    this.background = background;
  }

  public initialize() {
    this.storage = this.background.storage;
  }

  public async maybeAddHistory(tab: browser.tabs.Tab | undefined, url: string) {
    if (!tab || url === 'about:blank' || url === 'about:newtab') {
      return;
    }
    const cookieStoreId = tab.cookieStoreId!;
    if (
      cookieStoreId !== `${this.background.containerPrefix}-default` &&
      this.storage.local.tempContainers[cookieStoreId] &&
      this.storage.local.tempContainers[cookieStoreId].deletesHistory
    ) {
      if (!this.storage.local.tempContainers[cookieStoreId].history) {
        this.storage.local.tempContainers[cookieStoreId].history = {};
      }
      this.storage.local.tempContainers[cookieStoreId].history![url] = {
        tabId: tab.id!,
      };
      await this.storage.persist();
    }
  }

  public maybeClearHistory(cookieStoreId: CookieStoreId) {
    let count = 0;
    if (
      this.storage.local.tempContainers[cookieStoreId] &&
      this.storage.local.tempContainers[cookieStoreId].deletesHistory &&
      this.storage.local.tempContainers[cookieStoreId].history
    ) {
      const urls = Object.keys(
        this.storage.local.tempContainers[cookieStoreId].history!
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
