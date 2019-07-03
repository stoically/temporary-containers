// to have persistent listeners we need to register them early+sync
// and wait for tmp to fully initialize before handling events

class EventListeners {
  constructor() {
    debug('[event-listeners] initializing');
    this.tmpInitializedPromiseResolvers = [];
    this.tmpInitialized = this.tmpInitialized.bind(this);

    browser.webRequest.onBeforeRequest.addListener(this.wrap(
      'webRequest.onBeforeRequest', function() {
        return tmp.request.webRequestOnBeforeRequest.call(tmp.request, ...arguments);
      }, {
        timeout: 5 * 1000
      }
    ), {
      urls: ['<all_urls>'],
      types: ['main_frame']
    }, [
      'blocking'
    ]);

    browser.runtime.onMessage.addListener(this.wrap(
      'runtime.onMessage', function() {
        return tmp.runtime.onMessage.call(tmp.runtime, ...arguments);
      }, {
        timeout: 20 * 1000
      })
    );

    browser.runtime.onMessageExternal.addListener(this.wrap(
      'runtime.onMessageExternal', function() {
        return tmp.runtime.onMessageExternal.call(tmp.runtime, ...arguments);
      }, {
        timeout: 30 * 1000
      })
    );

    browser.runtime.onStartup.addListener(this.wrap(
      'runtime.onStartup', function() {
        return tmp.runtime.onStartup.call(tmp.runtime, ...arguments);
      }, {
        timeout: 30 * 1000
      })
    );
  }

  wrap(eventName, listener, options) {
    const tmpInitializedPromise = this.createTmpInitializedPromise(options);

    return async function() {
      if (!window.tmp || !window.tmp.initialized) {
        try {
          await tmpInitializedPromise;
        } catch (error) {
          debug(`[event-listeners] wrapper for ${eventName} timed out after ${options.timeout}ms`);
          throw new Error('Timed out while waiting for Add-on to initialize');
        }
      }
      return listener(...arguments);
    };
  }

  createTmpInitializedPromise(options) {
    const abortController = new AbortController;
    const timeout = window.setTimeout(() => {
      abortController.abort();
    }, options.timeout);

    return new Promise((resolve, reject) => {
      this.tmpInitializedPromiseResolvers.push({resolve, timeout});

      abortController.signal.addEventListener('abort', () => {
        reject();
      });
    });
  }

  tmpInitialized() {
    this.tmpInitializedPromiseResolvers.map(resolver => {
      clearTimeout(resolver.timeout);
      resolver.resolve();
    });
  }
}

window.eventListeners = new EventListeners;