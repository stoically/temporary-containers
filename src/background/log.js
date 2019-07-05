/* eslint-disable no-console */

class Log {
  constructor() {
    this.DEBUG = false;
    this.stringify = true;
    this.checkedLocalStorage = false;
    this.checkLocalStoragePromise = this.checkLocalStorage();

    this.debug = this.debug.bind(this);
    browser.runtime.onInstalled.addListener(this.onInstalledListener.bind(this));
  }

  async debug(...args) {
    let date;
    if (!this.checkedLocalStorage && !browser._mochaTest) {
      date = new Date().toUTCString();
      await this.checkLocalStoragePromise;
    }

    if (!this.DEBUG) {
      return;
    }

    if (!date) {
      date = new Date().toUTCString();
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
      console.log(date, ...args.map(JSON.stringify));
      console.trace();
      console.log('------------------------------------------');
    } else {
      console.log(date, ...args.slice(0));
    }
  }

  checkLocalStorage() {
    if (this.DEBUG) {
      return;
    }

    // let's put this in the js event queue, just to make sure
    // that localstorage doesn't block registering event-listeners at all
    return new Promise(resolve => setTimeout(() => {
      if (window.localStorage.getItem('debug')) {
        this.DEBUG = true;
        this.stringify = true;
        this.checkedLocalStorage = true;
        this.debug('[log] enabled debug because of localstorage item');
      } else if (window.localStorage.getItem('debug-dev')) {
        this.DEBUG = true;
        this.stringify = false;
        this.checkedLocalStorage = true;
        this.debug('[log] enabled debug-dev because of localstorage item');
      }
      resolve();
    }));
  }

  onInstalledListener(details) {
    browser.runtime.onInstalled.removeListener(this.onInstalledListener);

    if (!this.DEBUG && details.temporary) {
      this.DEBUG = true;
      this.stringify = false;

      if (details.reason === 'update') {
        browser.tabs.create({
          url: browser.runtime.getURL('options.html')
        });
      }

      this.debug('[log] enabled debug-dev because of temporary install', details);
    }
  }
}

window.log = new Log;
// eslint-disable-next-line
window.debug = log.debug;