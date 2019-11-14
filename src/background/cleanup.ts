import { TemporaryContainers } from './tmp';
import { Container } from './container';
import { History } from './history';
import { delay, PQueue } from './lib';
import { Statistics } from './statistics';
import { Storage } from './storage';
import { PreferencesSchema, CookieStoreId, Permissions, Debug } from '~/types';

export class Cleanup {
  private background: TemporaryContainers;
  private debug: Debug;
  private pref!: PreferencesSchema;
  private storage!: Storage;
  private container!: Container;
  private history!: History;
  private statistics!: Statistics;
  private permissions!: Permissions;

  private queued = new Set();
  private queue = new PQueue({ concurrency: 1 });

  constructor(background: TemporaryContainers) {
    this.background = background;
    this.debug = background.debug;

    setInterval(() => {
      this.debug('[interval] container cleanup interval');
      this.cleanup();
    }, 600000);
  }

  public initialize(): void {
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
  ): Promise<void> {
    if (this.queued.has(cookieStoreId)) {
      this.debug(
        '[addToRemoveQueue] container already in queue',
        cookieStoreId
      );
      return;
    }
    this.queued.add(cookieStoreId);

    const containerRemovalDelay = this.container.getRemovalDelay(cookieStoreId);
    if (containerRemovalDelay && !skipDelay) {
      this.debug(
        '[addToRemoveQueue] waiting to add container removal to queue',
        containerRemovalDelay,
        cookieStoreId
      );
      await delay(containerRemovalDelay);
    }

    this.debug('[addToRemoveQueue] queuing container removal', cookieStoreId);

    this.queue
      .add(async () => {
        const containerRemoved = await this.tryToRemove(cookieStoreId);
        if (containerRemoved) {
          this.debug(
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

        this.debug('[addToRemoveQueue] queue empty');
        this.statistics.finish();
        this.container.cleanupNumbers();
      });
  }

  public async tryToRemove(cookieStoreId: CookieStoreId): Promise<boolean> {
    try {
      const tempTabs = await browser.tabs.query({
        cookieStoreId,
      });
      if (tempTabs.length > 0) {
        this.debug(
          '[tryToRemove] not removing container because it still has tabs',
          cookieStoreId,
          tempTabs.length
        );
        return false;
      }
      this.debug(
        '[tryToRemove] no tabs in temp container anymore, deleting container',
        cookieStoreId
      );
    } catch (error) {
      this.debug('[tryToRemove] failed to query tabs', cookieStoreId, error);
      return false;
    }

    const historyClearedCount = this.history.maybeClearHistory(cookieStoreId);
    this.statistics.update(historyClearedCount, cookieStoreId);
    this.container.cleanupNumber(cookieStoreId);

    await this.removeContainer(cookieStoreId);
    await this.storage.persist();
    return true;
  }

  public async removeContainer(cookieStoreId: CookieStoreId): Promise<boolean> {
    try {
      const contextualIdentity = await browser.contextualIdentities.remove(
        cookieStoreId
      );
      if (!contextualIdentity) {
        this.debug(
          '[removeContainer] couldnt find container to remove, probably already removed',
          cookieStoreId
        );
      } else {
        this.debug('[removeContainer] container removed', cookieStoreId);
      }
      await this.container.removeFromStorage(cookieStoreId);
      return true;
    } catch (error) {
      this.debug(
        '[removeContainer] error while removing container',
        cookieStoreId,
        error
      );
      return false;
    }
  }

  public async cleanup(skipDelay = false): Promise<void> {
    const containers = this.container.getAllIds();
    if (!containers.length) {
      this.debug('[cleanup] canceling, no containers at all');
      return;
    }
    if (await this.onlySessionRestoreOrNoTabs()) {
      this.debug('[cleanup] canceling, only sessionrestore or no tabs');
      return;
    }

    containers.map(
      cookieStoreId =>
        !this.queued.has(cookieStoreId) &&
        this.addToRemoveQueue(cookieStoreId, skipDelay)
    );
  }

  public async onlySessionRestoreOrNoTabs(): Promise<boolean> {
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
      this.debug('[onlySessionRestoreOrNoTabs] failed to query tabs', error);
    }
    return false;
  }

  public maybeShowNotification(message: string): void {
    if (!this.pref.notifications || !this.permissions.notifications) {
      return;
    }

    this.debug('[maybeShowNotification] showing notification');
    browser.notifications.create({
      type: 'basic',
      title: 'Temporary Containers',
      iconUrl: 'icons/page-w-32.svg',
      message,
    });
  }
}
