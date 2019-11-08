class ContainerCleanup {
  constructor(background) {
    this.background = background;

    this.queued = new Set();
    this.queue = new PQueue({ concurrency: 1 });

    setInterval(() => {
      debug('[interval] container cleanup interval');
      this.cleanup();
    }, 600000);
  }

  initialize() {
    this.pref = this.background.pref;
    this.storage = this.background.storage;
    this.container = this.background.container;
    this.tabs = this.background.tabs;
    this.history = this.background.history;
    this.utils = this.background.utils;
    this.statistics = this.background.statistics;
    this.permissions = this.background.permissions;
  }

  async addToRemoveQueue(cookieStoreId, skipDelay = false) {
    if (this.queued.has(cookieStoreId)) {
      debug('[addToRemoveQueue] container already in queue', cookieStoreId);
      return;
    }
    this.queued.add(cookieStoreId);

    const containerRemovalDelay = this.container.getRemovalDelay(cookieStoreId);
    if (containerRemovalDelay && !skipDelay) {
      debug(
        '[addToRemoveQueue] waiting to add container removal to queue',
        containerRemovalDelay,
        cookieStoreId
      );
      await delay(containerRemovalDelay);
    }

    debug('[addToRemoveQueue] queuing container removal', cookieStoreId);

    this.queue
      .add(async () => {
        const containerRemoved = await this.tryToRemove(cookieStoreId);
        this.queued.delete(cookieStoreId);

        if (containerRemoved) {
          debug(
            '[addToRemoveQueue] container removed, waiting a bit',
            cookieStoreId
          );
          await delay(3000);
        }
      })
      .then(() => {
        if (this.queue.pending) {
          return;
        }
        debug('[addToRemoveQueue] queue empty');
        this.statistics.finish();

        // fallback cleanup of container numbers
        this.container.cleanupNumbers();
      });
  }

  async tryToRemove(cookieStoreId) {
    try {
      await browser.contextualIdentities.get(cookieStoreId);
    } catch (error) {
      debug(
        '[tryToRemove] container not found, removing entry from storage',
        cookieStoreId,
        error
      );
      await this.container.removeFromStorage(cookieStoreId);
      return false;
    }

    try {
      const tempTabs = await browser.tabs.query({
        cookieStoreId,
      });
      if (tempTabs.length > 0) {
        debug(
          '[tryToRemove] not removing container because it still has tabs',
          cookieStoreId,
          tempTabs.length
        );
        return false;
      }
      debug(
        '[tryToRemove] no tabs in temp container anymore, deleting container',
        cookieStoreId
      );
    } catch (error) {
      debug('[tryToRemove] failed to query tabs', cookieStoreId, error);
      return false;
    }
    let cookies = [];
    try {
      cookies = await browser.cookies.getAll({ storeId: cookieStoreId });
    } catch (error) {
      debug('[tryToRemove] couldnt get cookies', cookieStoreId, error);
    }

    const historyClearedCount = this.history.maybeClearHistory(cookieStoreId);
    this.statistics.update(historyClearedCount, cookies.length, cookieStoreId);
    this.container.cleanupNumber(cookieStoreId);

    const containerRemoved = await this.removeContainer(cookieStoreId);
    if (containerRemoved) {
      delete this.storage.local.tempContainers[cookieStoreId];
    }

    await this.storage.persist();
    return true;
  }

  async removeContainer(cookieStoreId) {
    try {
      const contextualIdentity = await browser.contextualIdentities.remove(
        cookieStoreId
      );
      if (!contextualIdentity) {
        debug(
          '[removeContainer] couldnt find container to remove, probably already removed',
          cookieStoreId
        );
      } else {
        debug('[removeContainer] container removed', cookieStoreId);
      }
      return true;
    } catch (error) {
      debug(
        '[removeContainer] error while removing container',
        cookieStoreId,
        error
      );
      return false;
    }
  }

  async cleanup(skipDelay = false) {
    const containers = this.container.getAllIds();
    if (!containers.length) {
      debug('[cleanup] canceling, no containers at all');
      return;
    }
    if (await this.onlySessionRestoreOrNoTabs()) {
      debug('[cleanup] canceling, only sessionrestore or no tabs');
      return;
    }

    if (containers.length) {
      containers.map(
        cookieStoreId =>
          !this.queued.has(cookieStoreId) &&
          this.addToRemoveQueue(cookieStoreId, skipDelay)
      );
    }
  }

  async onlySessionRestoreOrNoTabs() {
    // don't do a cleanup if there are no tabs or a sessionrestore tab
    try {
      const tabs = await browser.tabs.query({});
      if (
        !tabs.length ||
        tabs.find(tab => tab.url === 'about:sessionrestore')
      ) {
        return true;
      }
    } catch (error) {
      debug('[onlySessionRestoreOrNoTabs] failed to query tabs', error);
    }
    return false;
  }

  maybeShowNotification(message) {
    if (!this.pref.notifications || !this.permissions.notifications) {
      return;
    }

    debug('[maybeShowNotification] showing notification');
    browser.notifications.create({
      type: 'basic',
      title: 'Temporary Containers',
      iconUrl: 'icons/page-w-32.svg',
      message,
    });
  }
}

export default ContainerCleanup;
