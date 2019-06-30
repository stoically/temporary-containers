// to have a persistent listeners we need to register them early
// and wait for tmp to fully initialize before handling them
const conditionalCalls = [];
const condition = () => window.tmp && window.tmp.initialized;

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
  },
  {
    name: 'onInstalled',
    func: browser.runtime.onInstalled,
    listener: function() {
      return tmp.runtime.onInstalled.call(tmp.runtime, ...arguments);
    },
    condition: () => window.tmp
  }
]
  .map(event => {
    const conditionalListener = new window.ConditionalCall({
      condition: event.condition || condition,
      func: event.listener,
      name: event.name,
      debug
    });
    conditionalCalls.push(conditionalListener.met);
    event.func.addListener.apply(event.func, event.options ?
      [conditionalListener.func].concat(event.options) :
      [conditionalListener.func]
    );
  });


window.tmpInitialized = () => {
  conditionalCalls.map(met => met());
};