import { TemporaryContainers } from '../background';
import { Container } from './container';
import { TabId } from './tabs';
import { PreferencesSchema, ToolbarIconColor } from '~/types';

export class BrowserAction {
  private background: TemporaryContainers;
  private pref!: PreferencesSchema;
  private container!: Container;

  constructor(background: TemporaryContainers) {
    this.background = background;
  }

  public initialize() {
    this.pref = this.background.pref;
    this.container = this.background.container;

    if (this.pref.browserActionPopup) {
      this.setPopup();
    }
    if (this.pref.iconColor !== 'default') {
      this.setIcon(this.pref.iconColor);
    }
    if (!this.pref.isolation.active) {
      this.addIsolationInactiveBadge();
    }
  }

  public onClicked() {
    return this.container.createTabInTempContainer({
      deletesHistory: this.pref.deletesHistory.automaticMode === 'automatic',
    });
  }

  public setPopup() {
    browser.browserAction.setPopup({
      popup: 'popup.html',
    });
    browser.browserAction.setTitle({ title: 'Temporary Containers' });
  }

  public unsetPopup() {
    browser.browserAction.setPopup({
      popup: null,
    });
    browser.browserAction.setTitle({ title: null });
  }

  public setIcon(iconColor: ToolbarIconColor) {
    const iconPath = '../../icons';
    let iconColorFileName: string = iconColor;
    if (iconColor === 'default') {
      iconColorFileName = 'd';
    }
    const icon = {
      path: {
        16: `${iconPath}/page-${iconColorFileName}-16.svg`,
        32: `${iconPath}/page-${iconColorFileName}-32.svg`,
      },
    };
    browser.browserAction.setIcon(icon);
  }

  public addBadge(tabId: TabId) {
    if (!this.pref.isolation.active) {
      return;
    }

    browser.browserAction.setTitle({
      title: 'Automatic Mode on navigation active',
      tabId,
    });
    browser.browserAction.setBadgeBackgroundColor({
      color: '#f9f9fa',
      tabId,
    });
    browser.browserAction.setBadgeText({
      text: 'A',
      tabId,
    });
  }

  public removeBadge(tabId: TabId) {
    if (!this.pref.isolation.active) {
      return;
    }

    browser.browserAction.setTitle({
      title: !this.pref.browserActionPopup
        ? 'Open a new tab in a new Temporary Container (Alt+C)'
        : 'Temporary Containers',
      tabId,
    });
    browser.browserAction.setBadgeText({
      text: null,
      tabId,
    });
  }

  public async addIsolationInactiveBadge() {
    browser.browserAction.setBadgeBackgroundColor({
      color: 'red',
    });
    browser.browserAction.setBadgeText({
      text: '!',
    });

    const tabs = await browser.tabs.query({
      currentWindow: true,
      active: true,
    });
    browser.browserAction.setBadgeBackgroundColor({
      color: 'red',
      tabId: tabs[0].id,
    });
    browser.browserAction.setBadgeText({
      text: null,
      tabId: tabs[0].id,
    });
  }

  public removeIsolationInactiveBadge() {
    browser.browserAction.setBadgeText({
      text: '',
    });
  }
}
