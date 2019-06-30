// to have a persistent webrequest listener we need to register it early
// and wait for tmp to fully initialize before handling the request handling

window.waitCall = ({target, timeout, waitPromise, abortController, timedOut, check}) => async function() {
  if (check()) {
    if (timedOut) {
      debug('[tmp] timed out before, ignoring', target);
      return;
    }
    debug(`[tmp] waiting up to ${timeout}ms before calling`, target);
    const abortTimeout = setTimeout(() => {
      abortController.abort();
    }, timeout);
    await waitPromise;
    clearTimeout(abortTimeout);
  }
  return tmp[target[0]][target[1]].call(tmp[target[0]], ...arguments);
};

let initializeTimedOut = false;
const initializeAbortController = new AbortController();
const initializePromise = new Promise((resolve, reject) => {
  window.tmpInitialized = () => {
    debug('[tmp] initialized');
    resolve();
  };
  initializeAbortController.signal.addEventListener('abort', () => {
    debug('[tmp] timed out while waiting for initializing');
    initializeTimedOut = true;
    reject();
  });
});
const initializeWaitCall = (target, timeout) => window.waitCall({
  target, timeout, waitPromise: initializePromise, abortController: initializeAbortController,
  timedOut: initializeTimedOut, check: () => !window.tmp || !window.tmp.initialized
});

browser.webRequest.onBeforeRequest.addListener(
  initializeWaitCall(['request', 'webRequestOnBeforeRequest'], 5000)
  , {
    urls: ['<all_urls>'],
    types: ['main_frame']
  }, [
    'blocking'
  ]
);