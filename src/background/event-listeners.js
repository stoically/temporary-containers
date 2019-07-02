// to have persistent listeners we need to register them early
// and wait for tmp to fully initialize before handling events

const tmpInitializedAbortController = new AbortController;
const tmpInitializedTimeout = window.setTimeout(() => {
  tmpInitializedAbortController.abort();
  debug('[event-listeners] tmpInitialized timed out');
}, 5000);

const tmpInitializedPromise = new Promise((resolve, reject) => {
  window.tmpInitialized = () => {
    clearTimeout(tmpInitializedTimeout);
    resolve();
  };

  tmpInitializedAbortController.signal.addEventListener('abort', () => {
    reject();
  });
});

[
  {
    func: browser.webRequest.onBeforeRequest,
    options: [{
      urls: ['<all_urls>'],
      types: ['main_frame']
    }, [
      'blocking'
    ]],
    listener: function() {
      return tmp.request.webRequestOnBeforeRequest.call(tmp.request, ...arguments);
    },
  },
  {
    func: browser.runtime.onMessage,
    listener: function() {
      return tmp.runtime.onMessage.call(tmp.runtime, ...arguments);
    },
  },
  {
    func: browser.runtime.onMessageExternal,
    listener: function() {
      return tmp.runtime.onMessageExternal.call(tmp.runtime, ...arguments);
    },
  },
  {
    func: browser.runtime.onStartup,
    listener: function() {
      return tmp.runtime.onStartup.call(tmp.runtime, ...arguments);
    },
  }
]
  .map(event => {
    event.func.addListener(async function() {
      if (!tmp || !tmp.initialized) {
        await tmpInitializedPromise;
      }
      return event.listener(...arguments);
    }, ...event.options || []);
  });