import { BrowserFake } from './setup';
import { TemporaryContainers } from '~/background/tmp';
import { Tab, OnBeforeRequestResult, ClickEvent, TmpTabOptions } from '~/types';

export class Helper {
  private browser: BrowserFake;
  private background: TemporaryContainers;

  constructor(browser: BrowserFake, background: TemporaryContainers) {
    this.browser = browser;
    this.background = background;
  }

  async createTmpTab(options: TmpTabOptions): Promise<Tab> {
    const tab = await this.background.container.createTabInTempContainer(
      options
    );
    if (!tab) {
      throw new Error('something went wrong while creating tmp tab');
    }
    this.resetHistory();
    return tab;
  }

  resetHistory(): void {
    this.browser.sinonSandbox.resetHistory();
    this.background.eventlisteners.register();
  }

  async clickLink(url: string, sender: Tab, type = 'middle'): Promise<void> {
    const fakeSender = { tab: sender };
    const fakeMessage = {
      method: 'linkClicked',
      payload: {
        href: url,
        event: {
          button: type === 'middle' ? 1 : 0,
          ctrlKey: false,
        },
      },
    };
    await this.background.runtime.onMessage(fakeMessage, fakeSender);
  }

  fakeTab(tab: Partial<Tab>): Tab {
    return {
      id: 1,
      url: 'http://example.com',
      windowId: 1,
      cookieStoreId: 'firefox-default',
      index: 0,
      highlighted: false,
      active: true,
      pinned: false,
      incognito: false,
      ...tab,
    };
  }

  /* ------------------ legacy ------------------ */

  private requestId = 1;

  async openNewTmpTab({
    tabId = 1,
    createsTabId = 2,
    createsContainer = 'firefox-tmp1',
    resetHistory = true,
  }): Promise<void> {
    this.browser.tabs.query.resolves([{}, {}]);
    const fakeCreatedContainer = {
      cookieStoreId: createsContainer,
    };
    const fakeCreatedTab = {
      id: createsTabId,
      openerTabId: tabId,
    };
    this.browser.contextualIdentities.create.resolves(fakeCreatedContainer);
    this.browser.tabs.create.resolves(fakeCreatedTab);
    this.browser.tabs.get.resolves({
      id: tabId,
      cookieStoreId: createsContainer,
    });
    const [promise] = (this.browser.browserAction.onClicked.addListener.yield({
      id: tabId,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    }) as unknown) as any[];
    await promise;
    if (resetHistory) {
      this.browser.contextualIdentities.create.resetHistory();
      this.browser.tabs.create.resetHistory();
      this.browser.tabs.get.resetHistory();
    }
  }

  request({
    requestId = 0,
    tabId = 1,
    tabUrl = '',
    url = '',
    originContainer = 'firefox-default',
    createsContainer = 'firefox-tmp1',
    createsTabId = 2,
    macWasFaster = false,
    resetHistory = false,
  }): Promise<OnBeforeRequestResult> {
    this.browser.tabs.query.resolves([{}, {}]);
    if (!requestId) {
      requestId = this.requestId++;
    }
    if (resetHistory) {
      this.browser.tabs.remove.resetHistory();
      this.browser.tabs.create.resetHistory();
      this.browser.contextualIdentities.create.resetHistory();
    }

    const fakeRequest: {
      cookieStoreId: string;
      requestId: string;
      tabId: number;
      url: string;
      method: string;
      frameId: number;
      parentFrameId: number;
      type: browser.webRequest.ResourceType;
      timeStamp: number;
      thirdParty: boolean;
      urlClassification: browser.webRequest.UrlClassification;
    } = {
      cookieStoreId: originContainer,
      requestId: requestId + '',
      tabId,
      url,
      method: 'GET',
      frameId: 0,
      parentFrameId: 0,
      type: 'main_frame',
      timeStamp: 0,
      thirdParty: false,
      urlClassification: {
        firstParty: [],
        thirdParty: [],
      },
    };
    const fakeTab = {
      id: tabId,
      cookieStoreId: originContainer,
      url: tabUrl,
    };
    const fakeCreatedContainer = {
      cookieStoreId: createsContainer,
    };
    const fakeCreatedTab = {
      id: createsTabId,
      openerTabId: tabId,
    };
    if (macWasFaster) {
      this.browser.tabs.get.rejects({ mac: 'was faster' });
    } else {
      this.browser.tabs.get.resolves(fakeTab);
    }
    this.browser.contextualIdentities.create.resolves(fakeCreatedContainer);
    this.browser.tabs.create.resolves(fakeCreatedTab);

    return this.background.request.webRequestOnBeforeRequest(fakeRequest);
  }

  async mouseClickOnLink({
    originTabId = 1,
    clickType = 'left',
    domainCombination = '',
    senderUrl = '',
    targetUrl = '',
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }): Promise<any> {
    switch (domainCombination) {
      case 'notsameexact':
        senderUrl = 'https://notexample.com';
        targetUrl = 'https://example.com';
        break;
    }

    let clickEvent: ClickEvent;
    switch (clickType) {
      case 'middle':
        clickEvent = {
          button: 1,
          ctrlKey: false,
          metaKey: false,
        };
        break;
      case 'ctrlleft':
        clickEvent = {
          button: 0,
          ctrlKey: true,
          metaKey: false,
        };
        break;
      case 'left':
        clickEvent = {
          button: 0,
          ctrlKey: false,
          metaKey: false,
        };
        break;

      default:
        throw new Error('unknown clicktype');
    }

    const fakeSender: {
      tab: Tab;
    } = {
      tab: {
        id: originTabId,
        url: senderUrl,
        index: 0,
        highlighted: false,
        active: true,
        pinned: false,
        incognito: false,
        windowId: 1,
        cookieStoreId: 'firefox-default',
      },
    };
    const fakeMessage = {
      method: 'linkClicked',
      payload: {
        href: targetUrl,
        event: clickEvent,
      },
    };
    return await this.background.runtime.onMessage(fakeMessage, fakeSender);
  }

  openMacConfirmPage({
    tabId = 1,
    originContainer = 'firefox-default',
    url = 'http://example.com',
    targetContainer = '',
    resetHistory = false,
  }): Promise<void> {
    if (resetHistory) {
      this.browser.tabs.remove.resetHistory();
      this.browser.tabs.create.resetHistory();
      this.browser.contextualIdentities.create.resetHistory();
    }

    let confirmPageUrl =
      'moz-extension://multi-account-containers/confirm-page.html?url=' +
      encodeURIComponent(url) +
      '&cookieStoreId=' +
      targetContainer;
    if (originContainer !== 'firefox-default') {
      confirmPageUrl += '&currentCookieStoreId=' + originContainer;
    }
    const changeInfo = {
      url: confirmPageUrl,
    };
    const tab: Tab = {
      id: tabId,
      cookieStoreId: originContainer,
      url: confirmPageUrl,
      index: 0,
      highlighted: false,
      active: true,
      pinned: false,
      incognito: false,
      windowId: 1,
    };

    return this.background.tabs.onUpdated(tabId, changeInfo, tab);
  }
}
