class Statistics {
  constructor(background) {
    this.background = background;

    this.removedContainerCount = 0;
    this.removedContainerCookiesCount = 0;
    this.removedContainerHistoryCount = 0;
    this.removedContentLength = 0;
    this.requests = {};
  }


  initialize() {
    this.pref = this.background.pref;
    this.storage = this.background.storage;
    this.container = this.background.container;
  }


  async collect(request) {
    if (!this.pref.statistics &&
        !this.pref.deletesHistory.statistics) {
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
        contentLength: 0
      };
    }
    if (!request.fromCache) {
      const contentLength = request.responseHeaders.find(header => header.name === 'content-length');
      if (contentLength) {
        this.requests[tab.cookieStoreId].contentLength += parseInt(contentLength.value);
      }
    }
  }


  update(historyClearedCount, cookieCount, cookieStoreId) {
    this.removedContainerCount++;

    if (historyClearedCount) {
      this.removedContainerHistoryCount += historyClearedCount;
    }
    if (this.pref.statistics) {
      this.storage.local.statistics.containersDeleted++;
    }

    if (this.pref.deletesHistory.statistics &&
        this.container.isTemporary(cookieStoreId, 'deletesHistory')) {
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

    if (this.requests[cookieStoreId] &&
        this.requests[cookieStoreId].contentLength) {
      if (this.pref.statistics) {
        this.storage.local.statistics.cacheDeleted += this.requests[cookieStoreId].contentLength;
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
        notificationMessage += `\nand ~${this.formatBytes(this.removedContentLength)} Cache`;
      }
      if (this.removedContainerHistoryCount) {
        notificationMessage += `\nand ${this.removedContainerHistoryCount} URLs from History`;
      }
      this.container.maybeShowNotification(notificationMessage);
    }

    this.removedContainerCount = 0;
    this.removedContainerCookiesCount = 0;
    this.removedContainerHistoryCount = 0;
    this.removedContentLength = 0;
  }


  formatBytes(bytes, decimals) {
    // https://stackoverflow.com/a/18650828
    if (bytes == 0) return '0 Bytes';
    const k = 1024,
      dm = decimals || 2,
      sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'],
      i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }
}

window.Statistics = Statistics;