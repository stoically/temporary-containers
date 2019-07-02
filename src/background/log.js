/* eslint-disable no-console */

class Log {
  constructor() {
    this.DEBUG = false;
    this.stringify = true;

    this.debug = this.debug.bind(this);

    if (window.localStorage.getItem('debug')) {
      this.DEBUG = true;
    } else if (window.localStorage.getItem('debug-dev')) {
      this.DEBUG = true;
      this.stringify = false;
    }

    this.debug('starting');
  }

  debug(...args) {
    if (!this.DEBUG) {
      return;
    }

    args = args.map(arg => {
      if (typeof arg === 'object' && arg.favIconUrl) {
        arg = JSON.parse(JSON.stringify(arg));
        delete arg.favIconUrl;
        return arg;
      }
      return arg;
    });

    if (this.stringify && !browser._mochaTest) {
      console.log(new Date().toUTCString(), ...args.map(JSON.stringify));
      console.trace();
      console.log('------------------------------------------');
    } else {
      console.log(new Date().toUTCString(), ...args.slice(0));
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