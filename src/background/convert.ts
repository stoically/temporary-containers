import { TemporaryContainers } from './tmp';
import { Container } from './container';
import { Storage } from './storage';
import { CookieStoreId, TabId } from '~/types';

export class Convert {
  private background: TemporaryContainers;
  private storage!: Storage;
  private container!: Container;

  constructor(background: TemporaryContainers) {
    this.background = background;
  }

  initialize(): void {
    this.storage = this.background.storage;
    this.container = this.background.container;
  }

  async convertTempContainerToPermanent({
    cookieStoreId,
    tabId,
    name,
  }: {
    cookieStoreId: CookieStoreId;
    tabId: TabId;
    name: string;
  }): Promise<void> {
    delete this.storage.local.tempContainers[cookieStoreId];
    await this.storage.persist();
    await browser.contextualIdentities.update(cookieStoreId, {
      name,
      color: 'blue',
    });
    await browser.tabs.reload(tabId);
  }

  async convertTempContainerToRegular({
    cookieStoreId,
    tabId,
  }: {
    cookieStoreId: CookieStoreId;
    tabId: TabId;
  }): Promise<void> {
    this.storage.local.tempContainers[cookieStoreId].deletesHistory = false;
    delete this.storage.local.tempContainers[cookieStoreId].history;
    await this.storage.persist();
    const name = this.storage.local.tempContainers[cookieStoreId].name.replace(
      '-deletes-history',
      ''
    );
    await browser.contextualIdentities.update(cookieStoreId, { name });
    await browser.tabs.reload(tabId);
  }

  async convertPermanentToTempContainer({
    cookieStoreId,
    tabId,
  }: {
    cookieStoreId: CookieStoreId;
    tabId: TabId;
  }): Promise<void> {
    const containerOptions = this.container.generateContainerNameIconColor();
    await browser.contextualIdentities.update(cookieStoreId, {
      name: containerOptions.name,
      icon: containerOptions.icon,
      color: containerOptions.color,
    });
    this.storage.local.tempContainers[cookieStoreId] = containerOptions;
    await this.storage.persist();
    await browser.tabs.reload(tabId);
  }
}
