/* eslint-disable no-console */

class Log {
  constructor() {
    this.DEBUG = false;
    this.stringify = true;

    this.debug = this.debug.bind(this);

    if (!browser._mochaTest && window.localStorage.getItem('debug')) {
      this.DEBUG = true;
      this.stringify = false;
    }
  }

  debug(...args) {
    if (!this.DEBUG) {
      return;
    }
    if (this.stringify && !browser._mochaTest) {
      console.log(...args.map(JSON.stringify));
      console.trace();
      console.log('------------------------------------------');
    } else {
      console.log(...args.slice(0));
    }
  }
}

const logOnInstalledListener = details => {
  browser.runtime.onInstalled.removeListener(logOnInstalledListener);
  if (details.temporary) {
    log.DEBUG = true;
    log.stringify = false;

    if (details.reason === 'update') {
      browser.tabs.create({
        url: browser.runtime.getURL('options.html')
      });
    }
  }
  debug('[log] onInstalled', details);
};
browser.runtime.onInstalled.addListener(logOnInstalledListener);

window.log = new Log;
// eslint-disable-next-line
window.debug = log.debug;