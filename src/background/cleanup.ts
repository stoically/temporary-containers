import { TemporaryContainers } from './tmp';
import { Container } from './container';
import { History } from './history';
import { delay, PQueue } from './lib';
import { Statistics } from './statistics';
import { Storage } from './storage';
import { PreferencesSchema, CookieStoreId, Permissions, Debug } from '~/types';
import { Tabs } from './tabs';

export class Cleanup {
  private background: TemporaryContainers;
  private debug: Debug;
  private pref!: PreferencesSchema;
  private storage!: Storage;
  private container!: Container;
  private history!: History;
  private statistics!: Statistics;
  private permissions!: Permissions;
  private tabs!: Tabs;

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

  initialize(): void {
    this.pref = this.background.pref;
    this.storage = this.background.storage;
    this.container = this.background.container;
    this.history = this.background.history;
    this.statistics = this.background.statistics;
    this.permissions = this.background.permissions;
    this.tabs = this.background.tabs;
  }

  async addToRemoveQueue(
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
        '[addToRemoveQueue] waiting before adding container removal to queue',
        containerRemovalDelay,
        cookieStoreId
      );
      await delay(containerRemovalDelay);
    }

    this.debug('[addToRemoveQueue] queuing container removal', cookieStoreId);

    await this.queue
      .add(async () => {
        const containerRemoved = await this.tryToRemove(cookieStoreId);
        if (containerRemoved) {
          this.debug(
            '[addToRemoveQueue] container removed, waiting 2s',
            cookieStoreId
          );
          await delay(2500);
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

  async tryToRemove(cookieStoreId: CookieStoreId): Promise<boolean> {
    const containerTabs = this.tabs.containerTabs.get(cookieStoreId);
    if (containerTabs?.size) {
      this.debug(
        '[tryToRemove] not removing container because it still has tabs',
        cookieStoreId,
        containerTabs.size
      );
      return false;
    }

    const historyClearedCount = this.history.maybeClearHistory(cookieStoreId);
    this.statistics.update(historyClearedCount, cookieStoreId);
    this.container.cleanupNumber(cookieStoreId);

    if (!(await this.removeContainer(cookieStoreId))) {
      await this.storage.persist();
    }
    return true;
  }

  async removeContainer(cookieStoreId: CookieStoreId): Promise<boolean> {
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

  async cleanup(startup = false): Promise<void> {
    const containers = this.container.getAllIds();
    if (!containers.length) {
      this.debug('[cleanup] canceling, no tmpcontainers at all');
      return;
    }
    if (
      startup &&
      (await browser.tabs.query({ url: 'about:sessionrestore' })).length
    ) {
      this.debug(
        "[cleanup] canceling because there's a about:sessionrestore tab"
      );
      return;
    }

    containers.map((cookieStoreId) =>
      this.addToRemoveQueue(cookieStoreId, startup)
    );
  }

  maybeShowNotification(message: string): void {
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
