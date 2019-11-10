import { TemporaryContainers } from '../background';
import { Container, CookieStoreId } from './container';
import { Storage } from './storage';
import { TabId } from './tabs';

export class Convert {
  private background: TemporaryContainers;
  private storage!: Storage;
  private container!: Container;

  constructor(background: TemporaryContainers) {
    this.background = background;
  }

  public initialize() {
    this.storage = this.background.storage;
    this.container = this.background.container;
  }

  public async convertTempContainerToPermanent({
    cookieStoreId,
    tabId,
    name,
  }: {
    cookieStoreId: CookieStoreId;
    tabId: TabId;
    name: string;
  }) {
    delete this.storage.local.tempContainers[cookieStoreId];
    await this.storage.persist();
    await browser.contextualIdentities.update(cookieStoreId, {
      name,
      color: 'blue',
    });
    await browser.tabs.reload(tabId);
  }

  public async convertTempContainerToRegular({
    cookieStoreId,
    tabId,
  }: {
    cookieStoreId: CookieStoreId;
    tabId: TabId;
  }) {
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

  public async convertPermanentToTempContainer({
    cookieStoreId,
    tabId,
  }: {
    cookieStoreId: CookieStoreId;
    tabId: TabId;
  }) {
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
