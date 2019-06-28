class BrowserAction {
  constructor(background) {
    this.background = background;
  }


  initialize() {
    this.storage = this.background.storage;
    this.container = this.background.container;

    browser.browserAction.onClicked.addListener(this.onClicked.bind(this));

    if (this.storage.local.preferences.browserActionPopup) {
      this.setPopup();
    }
    if (this.storage.local.preferences.iconColor !== 'default') {
      this.setIcon(this.storage.local.preferences.iconColor);
    }
    if (!this.storage.local.preferences.isolation.active) {
      this.addIsolationInactiveBadge();
    }
  }


  onClicked() {
    return this.container.createTabInTempContainer({
      deletesHistory: this.storage.local.preferences.deletesHistory.automaticMode === 'automatic'
    });
  }


  setPopup() {
    browser.browserAction.setPopup({
      popup: 'popup.html'
    });
    browser.browserAction.setTitle({title: 'Temporary Containers'});
  }


  unsetPopup() {
    browser.browserAction.setPopup({
      popup: null
    });
    browser.browserAction.setTitle({title: null});
  }


  setIcon(iconColor) {
    const iconPath = '../icons';
    if (iconColor === 'default') {
      iconColor = 'd';
    }
    const icon = {
      path: {
        16: `${iconPath}/page-${iconColor}-16.svg`,
        32: `${iconPath}/page-${iconColor}-32.svg`
      }
    };
    browser.browserAction.setIcon(icon);
  }


  addBadge(tabId) {
    if (!this.storage.local.preferences.isolation.active) {
      return;
    }

    browser.browserAction.setTitle({
      title: 'Automatic Mode on navigation active',
      tabId: tabId
    });
    browser.browserAction.setBadgeBackgroundColor({
      color: '#FF613D',
      tabId: tabId
    });
    browser.browserAction.setBadgeText({
      text: 'A',
      tabId: tabId
    });
  }


  removeBadge(tabId) {
    if (!this.storage.local.preferences.isolation.active) {
      return;
    }

    browser.browserAction.setTitle({
      title: !this.storage.local.preferences.browserActionPopup ?
        'Open a new Tab in a new Temporary Container (Alt+C)' :
        'Temporary Containers',
      tabId
    });
    browser.browserAction.setBadgeText({
      text: null,
      tabId: tabId
    });
  }

  async addIsolationInactiveBadge() {
    browser.browserAction.setBadgeBackgroundColor({
      color: 'red'
    });
    browser.browserAction.setBadgeText({
      text: '!'
    });

    const tabs = await browser.tabs.query({currentWindow: true, active: true});
    browser.browserAction.setBadgeBackgroundColor({
      color: 'red',
      tabId: tabs[0].id
    });
    browser.browserAction.setBadgeText({
      text: null,
      tabId: tabs[0].id
    });
  }

  removeIsolationInactiveBadge() {
    browser.browserAction.setBadgeText({
      text: ''
    });
  }
}

window.BrowserAction = BrowserAction;