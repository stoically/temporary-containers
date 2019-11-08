import { IPermissions, TemporaryContainers } from '../background';
import { Container, CookieStoreId } from './container';
import { History } from './history';
import { delay, PQueue } from './lib';
import { debug } from './log';
import { IPreferences } from './preferences';
import { Statistics } from './statistics';
import { Storage } from './storage';

export class Cleanup {
  private background: TemporaryContainers;
  private pref!: IPreferences;
  private storage!: Storage;
  private container!: Container;
  private history!: History;
  private statistics!: Statistics;
  private permissions!: IPermissions;

  private queued = new Set();
  private queue = new PQueue({ concurrency: 1 });

  constructor(background: TemporaryContainers) {
    this.background = background;

    setInterval(() => {
      debug('[interval] container cleanup interval');
      this.cleanup();
    }, 600000);
  }

  public initialize() {
    this.pref = this.background.pref;
    this.storage = this.background.storage;
    this.container = this.background.container;
    this.history = this.background.history;
    this.statistics = this.background.statistics;
    this.permissions = this.background.permissions;
  }

  public async addToRemoveQueue(
    cookieStoreId: CookieStoreId,
    skipDelay = false
  ) {
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
        if (containerRemoved) {
          debug(
            '[addToRemoveQueue] container removed, waiting a bit',
            cookieStoreId
          );
          await delay(3000);
        }
      })
      .finally(() => {
        this.queued.delete(cookieStoreId);

        if (this.queue.pending) {
          return;
        }

        debug('[addToRemoveQueue] queue empty');
        this.statistics.finish();
        this.container.cleanupNumbers();
      });
  }

  public async tryToRemove(cookieStoreId: CookieStoreId) {
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

    const historyClearedCount = this.history.maybeClearHistory(cookieStoreId);
    this.statistics.update(historyClearedCount, cookieStoreId);
    this.container.cleanupNumber(cookieStoreId);

    await this.removeContainer(cookieStoreId);
    await this.storage.persist();
    return true;
  }

  public async removeContainer(cookieStoreId: CookieStoreId) {
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
      await this.container.removeFromStorage(cookieStoreId);
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

  public async cleanup(skipDelay = false) {
    const containers = this.container.getAllIds();
    if (!containers.length) {
      debug('[cleanup] canceling, no containers at all');
      return;
    }
    if (await this.onlySessionRestoreOrNoTabs()) {
      debug('[cleanup] canceling, only sessionrestore or no tabs');
      return;
    }

    containers.map(
      cookieStoreId =>
        !this.queued.has(cookieStoreId) &&
        this.addToRemoveQueue(cookieStoreId, skipDelay)
    );
  }

  public async onlySessionRestoreOrNoTabs() {
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

  public maybeShowNotification(message: string) {
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
