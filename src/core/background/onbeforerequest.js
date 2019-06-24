// the very first thing we do is to register a blocking request handler
// this increases the chances that automatic mode and "always per website" catches requests on firefox start
const MAX_RETRIES = 20; // 2seconds
let waitingForInitializingFailed = false;
browser.webRequest.onBeforeRequest.addListener(async (request) => {
  if (!tmp || !tmp.initialized) {
    /* eslint-disable no-console */
    console.log('[onBeforeRequest] incoming request but tmp not initialized yet, probably startup', request);
    if (waitingForInitializingFailed) {
      console.log('[onBeforeRequest] we waited for tmp to initialize before', request);
      return;
    }
    console.log('[onBeforeRequest] we wait for tmp to initialize', request);
    let retry = 0;
    while (!tmp || !tmp.initialized) {
      console.log('[onBeforeRequest] tmp not yet initialized, waiting', request);
      await new Promise(resolve => setTimeout(resolve, 100));
      retry++;
      if (retry > MAX_RETRIES) {
        console.log('[onBeforeRequest] max retries reached, giving up', request);
        waitingForInitializingFailed = true;
        return;
      }
    }
  }
  return tmp.request.webRequestOnBeforeRequest(request);
},  {
  urls: ['<all_urls>'],
  types: ['main_frame']
}, [
  'blocking'
]);