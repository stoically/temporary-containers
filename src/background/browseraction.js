class BrowserAction {
  initialize(background) {
    this.storage = background.storage;
    this.container = background.container;

    browser.browserAction.onClicked.addListener(this.browserActionOnClicked.bind(this));

    if (this.storage.local.preferences.iconColor !== 'default') {
      this.setIcon(this.storage.local.preferences.iconColor);
    }
  }


  browserActionOnClicked() {
    return this.container.createTabInTempContainer({
      deletesHistory: this.storage.local.preferences.deletesHistoryContainer === 'automatic'
    });
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
}

window.BrowserAction = BrowserAction;