class ContainerCleanup {
  constructor(background) {
    this.background = background;

    this.removeContainerQueued = false;
    this.removeContainerQueue = new PQueue({ concurrency: 1 });

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

  async addTabToRemoveQueue(tabId) {
    if (!this.container.tabContainerMap[tabId]) {
      debug(
        '[addToRemoveQueue] removed tab that isnt in the tabContainerMap',
        tabId,
        this.container.tabContainerMap
      );
      return;
    }
    const cookieStoreId = this.container.tabContainerMap[tabId];
    debug(
      '[addToRemoveQueue] queuing container removal because of tab removal',
      tabId
    );
    this.addToRemoveQueue(cookieStoreId);
  }

  async addToRemoveQueue(cookieStoreId, noDelay = false) {
    if (!this.storage.local.tempContainers[cookieStoreId]) {
      debug(
        '[addToRemoveQueue] container from the tabContainerMap is unknown',
        cookieStoreId
      );
      return;
    }
    const containerType = this.storage.local.tempContainers[cookieStoreId]
      .deletesHistory
      ? 'deletesHistory'
      : 'regular';
    const containerRemovalDelay =
      containerType === 'deletesHistory'
        ? this.pref.deletesHistory.containerRemoval
        : this.pref.container.removal;

    if (containerRemovalDelay && !noDelay) {
      this.removeContainerQueued = true;
      debug(
        '[addToRemoveQueue] waiting to add container removal to queue',
        containerRemovalDelay,
        cookieStoreId
      );
      await delay(containerRemovalDelay);
    }

    debug('[addToRemoveQueue] queuing container removal', cookieStoreId);

    this.removeContainerQueue
      .add(async () => {
        if (!this.storage.local.tempContainers[cookieStoreId]) {
          debug(
            '[addToRemoveQueue] unknown container, probably already removed',
            cookieStoreId
          );
          return;
        }
        const containerRemoved = await this.tryToRemove(cookieStoreId);
        if (containerRemoved) {
          debug(
            '[addToRemoveQueue] container removed, waiting a bit',
            cookieStoreId
          );
          await delay(3000);
        }
      })
      .then(() => {
        if (this.removeContainerQueue.pending) {
          return;
        }
        debug('[addToRemoveQueue] queue empty');
        this.removeContainerQueued = false;
        this.statistics.finish();

        // fallback cleanup of container numbers
        this.storage.local.tempContainersNumbers = Object.values(
          this.storage.local.tempContainers
        ).map(container => container.number);
      });
  }

  async tryToRemove(cookieStoreId) {
    if (await this.onlySessionRestoreOrNoTabs()) {
      debug('[tryToRemove] canceling, only sessionrestore or no tabs');
      return false;
    }

    try {
      await browser.contextualIdentities.get(cookieStoreId);
    } catch (error) {
      debug(
        '[tryToRemove] container not found, removing entry from storage',
        cookieStoreId,
        error
      );
      this.storage.local.tempContainersNumbers = this.storage.local.tempContainersNumbers.filter(
        number =>
          this.storage.local.tempContainers[cookieStoreId].number !== number
      );
      delete this.storage.local.tempContainers[cookieStoreId];
      await this.storage.persist();
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
    this.storage.local.tempContainersNumbers = this.storage.local.tempContainersNumbers.filter(
      number => {
        return (
          this.storage.local.tempContainers[cookieStoreId].number !== number
        );
      }
    );

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
          '[tryToRemoveContainer] couldnt find container to remove, probably already removed',
          cookieStoreId
        );
      } else {
        debug('[tryToRemoveContainer] container removed', cookieStoreId);
      }
      Object.keys(this.container.tabContainerMap).map(tabId => {
        if (this.container.tabContainerMap[tabId] === cookieStoreId) {
          delete this.container.tabContainerMap[tabId];
        }
      });
      return true;
    } catch (error) {
      debug(
        '[tryToRemoveContainer] error while removing container',
        cookieStoreId,
        error
      );
      return false;
    }
  }

  async cleanup(browserStart) {
    if (!this.background.initialized) {
      debug('[cleanup] skipping because not initialized');
      return;
    }

    if (this.removeContainerQueued && !browserStart) {
      debug('[cleanup] skipping because queue isnt empty');
      return;
    }
    const containers = Object.keys(this.storage.local.tempContainers);
    if (!containers.length) {
      debug('[cleanup] canceling, no containers at all');
      return;
    }
    if (await this.onlySessionRestoreOrNoTabs()) {
      debug('[cleanup] canceling, only sessionrestore or no tabs');
      return;
    }

    containers.map(cookieStoreId => this.addToRemoveQueue(cookieStoreId, true));
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
