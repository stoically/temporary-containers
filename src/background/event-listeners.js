// to have a persistent listeners we need to register them early
// and wait for tmp to fully initialize before handling them
const tmpInitializedPromise = new window.PCancelable(resolve => window.tmpInitialized = resolve);
window.setTimeout(() => {
  tmpInitializedPromise.cancel();
}, 5000);

[
  {
    name: 'onBeforeRequest',
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
    name: 'onMessage',
    func: browser.runtime.onMessage,
    listener: function() {
      return tmp.runtime.onMessage.call(tmp.runtime, ...arguments);
    },
  },
  {
    name: 'onStartup',
    func: browser.runtime.onStartup,
    listener: function() {
      return tmp.runtime.onStartup.call(tmp.runtime, ...arguments);
    },
  }
]
  .map(async event => {
    event.func.addListener.apply(this, [async function() {
      try {
        if ((tmp && tmp.initialized) || await tmpInitializedPromise) {
          return event.listener.call(this, ...arguments);
        }
      } catch (error) {
        debug('[event-listeners] canceled because of time out', event.name);
      }
    }].concat(event.options || []));
  });