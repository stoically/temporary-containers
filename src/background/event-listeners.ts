// to have persistent listeners we need to register them early+sync
// and wait for tmp to fully initialize before handling events
import { debug } from './log';

class EventListeners {
  private tmpInitializedPromiseResolvers = [];
  private defaultTimeout = 30; // seconds
  private _listeners = [];

  constructor() {
    debug('[event-listeners] initializing');
    [
      {
        api: ['webRequest', 'onBeforeRequest'],
        options: [
          { urls: ['<all_urls>'], types: ['main_frame'] },
          ['blocking'],
        ],
        target: ['request', 'webRequestOnBeforeRequest'],
        timeout: 5,
      },
      {
        api: ['webRequest', 'onCompleted'],
        options: [{ urls: ['<all_urls>'], types: ['main_frame'] }],
        target: ['request', 'cleanupCanceled'],
      },
      {
        api: ['webRequest', 'onErrorOccurred'],
        options: [{ urls: ['<all_urls>'], types: ['main_frame'] }],
        target: ['request', 'cleanupCanceled'],
      },
      {
        api: ['webRequest', 'onCompleted'],
        options: [
          {
            urls: ['<all_urls>'],
            types: ['script', 'font', 'image', 'imageset', 'stylesheet'],
          },
          ['responseHeaders'],
        ],
        target: ['statistics', 'collect'],
      },
      {
        api: ['browserAction', 'onClicked'],
        target: ['browseraction', 'onClicked'],
      },
      {
        api: ['contextMenus', 'onClicked'],
        target: ['contextmenu', 'onClicked'],
      },
      {
        api: ['contextMenus', 'onShown'],
        target: ['contextmenu', 'onShown'],
      },
      {
        api: ['windows', 'onFocusChanged'],
        target: ['contextmenu', 'windowsOnFocusChanged'],
      },
      {
        api: ['webRequest', 'onBeforeSendHeaders'],
        options: [
          { urls: ['<all_urls>'], types: ['main_frame'] },
          ['blocking', 'requestHeaders'],
        ],
        target: ['cookies', 'maybeSetAndAddToHeader'],
      },
      {
        api: ['management', 'onDisabled'],
        target: ['management', 'disable'],
      },
      {
        api: ['management', 'onUninstalled'],
        target: ['management', 'disable'],
      },
      {
        api: ['management', 'onEnabled'],
        target: ['management', 'enable'],
      },
      ['commands', 'onCommand'],
      ['tabs', 'onActivated'],
      ['tabs', 'onCreated'],
      ['tabs', 'onUpdated'],
      ['tabs', 'onRemoved'],
      ['runtime', 'onMessage'],
      ['runtime', 'onMessageExternal'],
      ['runtime', 'onStartup'],
    ].map(conf => {
      const confIsObj = typeof conf === 'object';
      const api = (confIsObj && conf.api) || conf;
      const target = (confIsObj && conf.target) || api;
      const timeout = (confIsObj && conf.timeout) || this.defaultTimeout;

      const listener = this.wrap(
        api.join('.'),
        function() {
          return (window as any).tmp[target[0]][target[1]].call(
            (window as any).tmp[target[0]],
            ...arguments
          );
        },
        { timeout }
      );

      browser[api[0]][api[1]].addListener(
        listener,
        ...((confIsObj && conf.options) || [])
      );

      this._listeners.push({ listener, api });
    });
  }

  wrap(apiName, listener, options) {
    const tmpInitializedPromise = this.createTmpInitializedPromise(options);

    return async function() {
      if (!(window as any).tmp || !(window as any).tmp.initialized) {
        try {
          await tmpInitializedPromise;
        } catch (error) {
          debug(
            `[event-listeners] call to ${apiName} timed out after ${options.timeout}s`
          );
          throw error;
        }
      }
      return listener(...arguments);
    };
  }

  createTmpInitializedPromise(options) {
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

  tmpInitialized = () => {
    this.tmpInitializedPromiseResolvers.map(resolver => {
      clearTimeout(resolver.timeout);
      resolver.resolve();
    });
  };

  remove() {
    this._listeners.map(listener => {
      browser[listener.api[0]][listener.api[1]].removeListener(
        listener.listener
      );
    });
  }
}

export const eventListeners = new EventListeners();
