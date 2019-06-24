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
    browser.browserAction.setBadgeBackgroundColor({
      color: '#FF613D',
      tabId: tabId
    });
    browser.browserAction.setTitle({
      title: 'Automatic Mode on navigation active',
      tabId: tabId
    });
    browser.browserAction.setBadgeText({
      text: 'A',
      tabId: tabId
    });
  }


  removeBadge(tabId) {
    browser.browserAction.setTitle({
      title: 'Open a new Tab in a new Temporary Container (Alt+C)',
      tabId
    });
    browser.browserAction.setBadgeText({
      text: '',
      tabId
    });
  }
}

window.BrowserAction = BrowserAction;