/* eslint-disable @typescript-eslint/no-explicit-any */
import { TemporaryContainers } from './tmp';
import { Debug, Permissions } from '~/types';

// to have persistent listeners we need to register them early+sync
// and wait for tmp to fully initialize before handling events
export class EventListeners {
  private background: TemporaryContainers;
  private debug: Debug;
  private tmpInitializedPromiseResolvers: Array<{
    resolve: () => void;
    timeout: number;
  }> = [];
  private defaultTimeout = 30; // seconds
  private listeners: Array<{
    listener: () => void;
    api: any;
  }> = [];

  constructor(background: TemporaryContainers) {
    this.background = background;
    this.debug = background.debug;

    this.register();
  }

  register(): void {
    this.debug('[event-listeners] registering');

    browser.webRequest.onBeforeRequest.addListener(
      this.wrap(
        browser.webRequest.onBeforeRequest,
        this.background.request,
        'webRequestOnBeforeRequest',
        { timeout: 5 }
      ),
      { urls: ['<all_urls>'], types: ['main_frame'] },
      ['blocking']
    );
    browser.webRequest.onBeforeSendHeaders.addListener(
      this.wrap(
        browser.webRequest.onBeforeSendHeaders,
        this.background.cookies,
        'maybeSetAndAddToHeader'
      ),
      { urls: ['<all_urls>'], types: ['main_frame'] },
      ['blocking', 'requestHeaders']
    );
    browser.webRequest.onCompleted.addListener(
      this.wrap(
        browser.webRequest.onCompleted,
        this.background.statistics,
        'collect'
      ),
      {
        urls: ['<all_urls>'],
        types: ['script', 'font', 'image', 'imageset', 'stylesheet'],
      },
      ['responseHeaders']
    );
    browser.webRequest.onCompleted.addListener(
      this.wrap(
        browser.webRequest.onCompleted,
        this.background.request,
        'cleanupCanceled'
      ),
      { urls: ['<all_urls>'], types: ['main_frame'] }
    );
    browser.webRequest.onErrorOccurred.addListener(
      this.wrap(
        browser.webRequest.onErrorOccurred,
        this.background.request,
        'cleanupCanceled'
      ),
      { urls: ['<all_urls>'], types: ['main_frame'] }
    );
    browser.browserAction.onClicked.addListener(
      this.wrap(
        browser.browserAction.onClicked,
        this.background.browseraction,
        'onClicked'
      )
    );
    browser.contextMenus.onClicked.addListener(
      this.wrap(
        browser.contextMenus.onClicked,
        this.background.contextmenu,
        'onClicked'
      )
    );
    browser.contextMenus.onShown.addListener(
      this.wrap(
        browser.contextMenus.onShown,
        this.background.contextmenu,
        'onShown'
      )
    );
    browser.windows.onFocusChanged.addListener(
      this.wrap(
        browser.windows.onFocusChanged,
        this.background.contextmenu,
        'windowsOnFocusChanged'
      )
    );
    browser.management.onDisabled.addListener(
      this.wrap(
        browser.management.onDisabled,
        this.background.management,
        'disable'
      )
    );
    browser.management.onUninstalled.addListener(
      this.wrap(
        browser.management.onUninstalled,
        this.background.management,
        'disable'
      )
    );
    browser.management.onEnabled.addListener(
      this.wrap(
        browser.management.onEnabled,
        this.background.management,
        'enable'
      )
    );
    browser.management.onInstalled.addListener(
      this.wrap(
        browser.management.onUninstalled,
        this.background.management,
        'enable'
      )
    );
    browser.commands.onCommand.addListener(
      this.wrap(
        browser.commands.onCommand,
        this.background.commands,
        'onCommand'
      )
    );
    browser.tabs.onActivated.addListener(
      this.wrap(browser.tabs.onActivated, this.background.tabs, 'onActivated')
    );
    browser.tabs.onCreated.addListener(
      this.wrap(browser.tabs.onCreated, this.background.tabs, 'onCreated')
    );
    browser.tabs.onUpdated.addListener(
      this.wrap(browser.tabs.onUpdated, this.background.tabs, 'onUpdated')
    );
    browser.tabs.onRemoved.addListener(
      this.wrap(browser.tabs.onRemoved, this.background.tabs, 'onRemoved')
    );
    browser.runtime.onMessage.addListener(
      this.wrap(browser.runtime.onMessage, this.background.runtime, 'onMessage')
    );
    browser.runtime.onMessageExternal.addListener(
      this.wrap(
        browser.runtime.onMessageExternal,
        this.background.runtime,
        'onMessageExternal'
      )
    );
    browser.runtime.onStartup.addListener(
      this.wrap(browser.runtime.onStartup, this.background.runtime, 'onStartup')
    );

    this.registerPermissionedListener();

    // -- ipcontext --

    // speculative requests happen before browser extensions had the chance to
    // potentially "redirect" main_frame requests to the appropriate firefox
    // container, so we simply disable them altogether
    browser.privacy.network.networkPredictionEnabled.set({ value: false });

    browser.proxy.onRequest.addListener(
      this.wrap(
        browser.proxy.onRequest,
        this.background.ipcontext,
        'onProxyRequest'
      ),
      {
        urls: ['<all_urls>'],
      }
    );
    browser.webRequest.onCompleted.addListener(
      this.wrap(
        browser.webRequest.onCompleted,
        this.background.ipcontext,
        'requestCompleted'
      ),
      { urls: ['<all_urls>'], types: ['main_frame'] }
    );
    browser.webRequest.onErrorOccurred.addListener(
      this.wrap(
        browser.webRequest.onErrorOccurred,
        this.background.ipcontext,
        'requestError'
      ),
      { urls: ['<all_urls>'], types: ['main_frame'] }
    );
    browser.tabs.onCreated.addListener(
      this.wrap(browser.tabs.onCreated, this.background.ipcontext, 'tabCreated')
    );
    browser.tabs.onUpdated.addListener(
      this.wrap(browser.tabs.onUpdated, this.background.ipcontext, 'tabUpdated')
    );
    browser.tabs.onRemoved.addListener(
      this.wrap(browser.tabs.onRemoved, this.background.ipcontext, 'tabRemoved')
    );
  }

  registerPermissionedListener(permissions?: Permissions): void {
    permissions?.webNavigation &&
      browser.webNavigation?.onCommitted.addListener(
        this.wrap(
          browser.webNavigation?.onCommitted,
          this.background.scripts,
          'maybeExecute'
        )
      );
  }

  wrap(
    api: any,
    context: any,
    target: any,
    options: { timeout: number } = { timeout: this.defaultTimeout }
  ): (...listenerArgs: any) => Promise<any> {
    const tmpInitializedPromise = this.createTmpInitializedPromise(options);

    const listener = async (...listenerArgs: any): Promise<any> => {
      if (!this.background.initialized) {
        try {
          await tmpInitializedPromise;
        } catch (error) {
          this.debug(
            `[event-listeners] call to ${target.join('.')} timed out after ${
              options.timeout
            }s`
          );
          throw error;
        }
      }

      return context[target].call(context, ...listenerArgs);
    };

    this.listeners.push({ listener, api });
    return listener;
  }

  createTmpInitializedPromise(options: { timeout: number }): Promise<void> {
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

  public tmpInitialized = (): void => {
    this.tmpInitializedPromiseResolvers.map((resolver) => {
      resolver.resolve();
      window.clearTimeout(resolver.timeout);
    });
  };

  remove(): void {
    this.listeners.map((listener) => {
      listener.api.removeListener(listener.listener);
    });
  }
}
