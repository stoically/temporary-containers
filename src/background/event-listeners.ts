// to have persistent listeners we need to register them early+sync
// and wait for tmp to fully initialize before handling events
import { debug } from './log';

class EventListeners {
  private tmpInitializedPromiseResolvers: Array<{
    resolve: () => void;
    timeout: number;
  }> = [];
  private defaultTimeout = 30; // seconds
  private listeners: Array<{
    listener: () => void;
    api: any;
  }> = [];

  constructor() {
    debug('[event-listeners] initializing');

    browser.webRequest.onBeforeRequest.addListener(
      this.wrap(
        browser.webRequest.onBeforeRequest,
        ['request', 'webRequestOnBeforeRequest'],
        { timeout: 5 }
      ),
      { urls: ['<all_urls>'], types: ['main_frame'] },
      ['blocking']
    );
    browser.webRequest.onBeforeSendHeaders.addListener(
      this.wrap(browser.webRequest.onBeforeSendHeaders, [
        'cookies',
        'maybeSetAndAddToHeader',
      ]),
      { urls: ['<all_urls>'], types: ['main_frame'] },
      ['blocking', 'requestHeaders']
    );
    browser.webRequest.onCompleted.addListener(
      this.wrap(browser.webRequest.onCompleted, ['statistics', 'collect']),
      {
        urls: ['<all_urls>'],
        types: ['script', 'font', 'image', 'imageset', 'stylesheet'],
      },
      ['responseHeaders']
    );
    browser.webRequest.onCompleted.addListener(
      this.wrap(browser.webRequest.onCompleted, ['request', 'cleanupCanceled']),
      { urls: ['<all_urls>'], types: ['main_frame'] }
    );
    browser.webRequest.onErrorOccurred.addListener(
      this.wrap(browser.webRequest.onErrorOccurred, [
        'request',
        'cleanupCanceled',
      ]),
      { urls: ['<all_urls>'], types: ['main_frame'] }
    );
    browser.browserAction.onClicked.addListener(
      this.wrap(browser.browserAction.onClicked, ['browseraction', 'onClicked'])
    );
    browser.contextMenus.onClicked.addListener(
      this.wrap(browser.contextMenus.onClicked, ['contextmenu', 'onClicked'])
    );
    browser.contextMenus.onShown.addListener(
      this.wrap(browser.contextMenus.onShown, ['contextmenu', 'onShown'])
    );
    browser.windows.onFocusChanged.addListener(
      this.wrap(browser.windows.onFocusChanged, [
        'contextmenu',
        'windowsOnFocusChanged',
      ])
    );
    browser.management.onDisabled.addListener(
      this.wrap(browser.management.onDisabled, ['management', 'disable'])
    );
    browser.management.onUninstalled.addListener(
      this.wrap(browser.management.onUninstalled, ['management', 'disable'])
    );
    browser.management.onEnabled.addListener(
      this.wrap(browser.management.onEnabled, ['management', 'enable'])
    );
    browser.commands.onCommand.addListener(
      this.wrap(browser.commands.onCommand, ['commands', 'onCommand'])
    );
    browser.tabs.onActivated.addListener(
      this.wrap(browser.tabs.onActivated, ['tabs', 'onActivated'])
    );
    browser.tabs.onCreated.addListener(
      this.wrap(browser.tabs.onCreated, ['tabs', 'onCreated'])
    );
    browser.tabs.onUpdated.addListener(
      this.wrap(browser.tabs.onUpdated, ['tabs', 'onUpdated'])
    );
    browser.tabs.onRemoved.addListener(
      this.wrap(browser.tabs.onRemoved, ['tabs', 'onRemoved'])
    );
    browser.runtime.onMessage.addListener(
      this.wrap(browser.runtime.onMessage, ['runtime', 'onMessage'])
    );
    browser.runtime.onMessageExternal.addListener(
      this.wrap(browser.runtime.onMessageExternal, [
        'runtime',
        'onMessageExternal',
      ])
    );
    browser.runtime.onStartup.addListener(
      this.wrap(browser.runtime.onStartup, ['runtime', 'onStartup'])
    );
  }

  public wrap(
    api: any,
    target: string[],
    options: any = { timeout: this.defaultTimeout }
  ) {
    const tmpInitializedPromise = this.createTmpInitializedPromise(options);

    const listener = async (...wrapArgs: any) => {
      if (!(window as any).tmp || !(window as any).tmp.initialized) {
        try {
          await tmpInitializedPromise;
        } catch (error) {
          debug(
            `[event-listeners] call to ${target.join('.')} timed out after ${
              options.timeout
            }s`
          );
          throw error;
        }
      }

      return ((...listenerArgs: any[]) => {
        return (window as any).tmp[target[0]][target[1]].call(
          (window as any).tmp[target[0]],
          ...listenerArgs
        );
      })(...wrapArgs);
    };

    this.listeners.push({ listener, api });
    return listener;
  }

  public createTmpInitializedPromise(options: any) {
    const abortController = new AbortController();
    const timeout = window.setTimeout(() => {
      abortController.abort();
    }, options.timeout * 1000);

    return new Promise((resolve, reject) => {
      this.tmpInitializedPromiseResolvers.push({ resolve, timeout });

      abortController.signal.addEventListener('abort', () => {
        reject('Timed out while waiting for Add-on to initialize');
      });
    });
  }

  public tmpInitialized = () => {
    this.tmpInitializedPromiseResolvers.map(resolver => {
      clearTimeout(resolver.timeout);
      resolver.resolve();
    });
  };

  public remove() {
    this.listeners.map(listener => {
      listener.api.removeListener(listener.listener);
    });
  }
}

export const eventListeners = new EventListeners();
