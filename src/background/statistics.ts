import { debug } from './log';

export class Statistics {
  private removedContainerCount = 0;
  private removedContainerCookiesCount = 0;
  private removedContainerHistoryCount = 0;
  private removedContentLength = 0;
  private requests = {};

  private background: any;
  private pref: any;
  private storage: any;
  private container: any;
  private cleanup: any;

  constructor(background) {
    this.background = background;
  }

  initialize() {
    this.pref = this.background.pref;
    this.storage = this.background.storage;
    this.container = this.background.container;
    this.cleanup = this.background.cleanup;
  }

  async collect(request) {
    if (!this.pref.statistics && !this.pref.deletesHistory.statistics) {
      return;
    }

    if (request.tabId === -1) {
      return;
    }

    let tab;
    try {
      tab = await browser.tabs.get(request.tabId);
    } catch (error) {
      return;
    }

    if (!this.container.isTemporary(tab.cookieStoreId)) {
      return;
    }

    if (!this.requests[tab.cookieStoreId]) {
      this.requests[tab.cookieStoreId] = {
        contentLength: 0,
      };
    }
    if (!request.fromCache) {
      const contentLength = request.responseHeaders.find(
        header => header.name === 'content-length'
      );
      if (contentLength) {
        this.requests[tab.cookieStoreId].contentLength += parseInt(
          contentLength.value
        );
      }
    }
  }

  async update(historyClearedCount, cookieStoreId) {
    this.removedContainerCount++;

    let cookieCount = 0;
    try {
      const cookies = await browser.cookies.getAll({ storeId: cookieStoreId });
      cookieCount = cookies.length;
    } catch (error) {
      debug('[tryToRemove] couldnt get cookies', cookieStoreId, error);
    }

    if (historyClearedCount) {
      this.removedContainerHistoryCount += historyClearedCount;
    }
    if (this.pref.statistics) {
      this.storage.local.statistics.containersDeleted++;
    }

    if (
      this.pref.deletesHistory.statistics &&
      this.container.isTemporary(cookieStoreId, 'deletesHistory')
    ) {
      this.storage.local.statistics.deletesHistory.containersDeleted++;
      if (historyClearedCount) {
        this.storage.local.statistics.deletesHistory.urlsDeleted += historyClearedCount;
      }
      if (cookieCount) {
        this.storage.local.statistics.deletesHistory.cookiesDeleted += cookieCount;
      }
    }
    if (cookieCount) {
      if (this.pref.statistics) {
        this.storage.local.statistics.cookiesDeleted += cookieCount;
      }
      this.removedContainerCookiesCount += cookieCount;
    }

    if (
      this.requests[cookieStoreId] &&
      this.requests[cookieStoreId].contentLength
    ) {
      if (this.pref.statistics) {
        this.storage.local.statistics.cacheDeleted += this.requests[
          cookieStoreId
        ].contentLength;
      }
      this.removedContentLength += this.requests[cookieStoreId].contentLength;
    }

    delete this.requests[cookieStoreId];
  }

  finish() {
    if (this.removedContainerCount) {
      let notificationMessage = `Deleted Temporary Containers: ${this.removedContainerCount}`;
      if (this.removedContainerCookiesCount) {
        notificationMessage += `\nand ${this.removedContainerCookiesCount} Cookies`;
      }
      if (this.removedContentLength) {
        notificationMessage += `\nand ~${this.formatBytes(
          this.removedContentLength
        )} Cache`;
      }
      if (this.removedContainerHistoryCount) {
        notificationMessage += `\nand ${this.removedContainerHistoryCount} URLs from History`;
      }
      this.cleanup.maybeShowNotification(notificationMessage);
    }

    this.removedContainerCount = 0;
    this.removedContainerCookiesCount = 0;
    this.removedContainerHistoryCount = 0;
    this.removedContentLength = 0;
  }

  formatBytes(bytes, decimals = 2) {
    // https://stackoverflow.com/a/18650828
    if (bytes == 0) return '0 Bytes';
    const k = 1024,
      dm = decimals,
      sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'],
      i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }
}
