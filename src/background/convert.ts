export class Convert {
  private background: any;
  private storage: any;
  private container: any;

  constructor(background) {
    this.background = background;
  }

  initialize() {
    this.storage = this.background.storage;
    this.container = this.background.container;
  }

  async convertTempContainerToPermanent({ cookieStoreId, tabId, name }) {
    delete this.storage.local.tempContainers[cookieStoreId];
    await this.storage.persist();
    await browser.contextualIdentities.update(cookieStoreId, {
      name,
      color: 'blue',
    });
    await browser.tabs.reload(tabId);
  }

  async convertTempContainerToRegular({ cookieStoreId, tabId }) {
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

  async convertPermanentToTempContainer({ cookieStoreId, tabId }) {
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
