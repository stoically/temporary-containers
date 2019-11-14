import { TemporaryContainers } from './tmp';
import { Storage } from './storage';
import { Tab, CookieStoreId, Debug } from '~/types';

export class History {
  private background: TemporaryContainers;
  private debug: Debug;
  private storage!: Storage;

  constructor(background: TemporaryContainers) {
    this.background = background;
    this.debug = background.debug;
  }

  public initialize(): void {
    this.storage = this.background.storage;
  }

  public async maybeAddHistory(
    tab: Tab | undefined,
    url: string
  ): Promise<void> {
    if (!tab || url === 'about:blank' || url === 'about:newtab') {
      return;
    }
    const cookieStoreId = tab.cookieStoreId;
    const container = this.storage.local.tempContainers[cookieStoreId];
    if (
      cookieStoreId !== `${this.background.containerPrefix}-default` &&
      container &&
      container.deletesHistory
    ) {
      if (!container.history) {
        container.history = {};
      }
      container.history[url] = {
        tabId: tab.id,
      };
      await this.storage.persist();
    }
  }

  public maybeClearHistory(cookieStoreId: CookieStoreId): number {
    let count = 0;
    const container = this.storage.local.tempContainers[cookieStoreId];
    if (container && container.deletesHistory && container.history) {
      const urls = Object.keys(container.history);
      count = urls.length;
      urls.map(url => {
        if (!url) {
          return;
        }
        this.debug('[maybeClearHistory] removing url from history', url);
        browser.history.deleteUrl({ url });
      });
    }
    return count;
  }
}
