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
      this.toggleIsolationBadge();
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
    browser.browserAction.setTitle({
      title: 'Automatic Mode on navigation active',
      tabId: tabId
    });
    this.setBadgeText({
      text: 'A',
      tabId: tabId
    });
  }


  removeBadge(tabId) {
    browser.browserAction.setTitle({
      title: !this.storage.local.preferences.browserActionPopup ?
        'Open a new Tab in a new Temporary Container (Alt+C)' :
        'Temporary Containers',
      tabId
    });
    this.setBadgeText({
      text: '',
      tabId
    });
  }

  async setBadgeText({tabId, text}) {
    if (!this.storage.local.preferences.isolation.active && !text.startsWith('!')) {
      browser.browserAction.setBadgeBackgroundColor({
        color: 'red',
        tabId: tabId
      });
      text = `! ${text}`.trim();
    } else if (this.storage.local.preferences.isolation.active) {
      browser.browserAction.setBadgeBackgroundColor({
        color: '#FF613D',
        tabId: tabId
      });
      text = text.replace('!', '').trim();
    }

    browser.browserAction.setBadgeText({
      text,
      tabId
    });
  }

  async toggleIsolationBadge() {
    const [activeTab] = await browser.tabs.query({active: true, currentWindow: true});
    const text = await browser.browserAction.getBadgeText({tabId: activeTab.id});
    this.setBadgeText({tabId: activeTab.id, text});
  }
}

window.BrowserAction = BrowserAction;