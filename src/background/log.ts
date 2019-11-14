import { Debug } from '~/types';

/* eslint-disable @typescript-eslint/no-explicit-any */

export class Log {
  public DEBUG = false;
  public stringify = true;
  private checkedLocalStorage = false;
  private checkLocalStoragePromise = this.checkLocalStorage();

  constructor() {
    this.debug = this.debug.bind(this);
    browser.runtime.onInstalled.addListener(
      this.onInstalledListener.bind(this)
    );
  }

  public debug: Debug = async (...args: any[]): Promise<void> => {
    let date;
    if (!this.checkedLocalStorage && !window._mochaTest) {
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

    if (this.stringify && !window._mochaTest) {
      console.log(date, ...args.map(value => JSON.stringify(value)));
      console.log('------------------------------------------');
    } else {
      console.log(date, ...args.slice(0));
    }
  };

  public checkLocalStorage(): void | Promise<void> {
    if (this.DEBUG) {
      return;
    }

    // let's put this in the js event queue, just to make sure
    // that localstorage doesn't block registering event-listeners at all
    return new Promise(resolve =>
      setTimeout(() => {
        if (window.localStorage.getItem('debug-dev') === 'true') {
          this.DEBUG = true;
          this.stringify = false;
          this.checkedLocalStorage = true;
          this.debug('[log] enabled debug-dev because of localstorage item');
        } else if (window.localStorage.getItem('debug') === 'true') {
          this.DEBUG = true;
          this.stringify = true;
          this.checkedLocalStorage = true;
          this.debug('[log] enabled debug because of localstorage item');
        }
        resolve();
      })
    );
  }

  public onInstalledListener(details: any): void {
    browser.runtime.onInstalled.removeListener(this.onInstalledListener);

    if (!this.DEBUG && details.temporary) {
      this.DEBUG = true;
      this.stringify = false;

      if (details.reason === 'update') {
        browser.tabs.create({
          url: browser.runtime.getURL('options.html'),
        });
      }

      this.debug(
        '[log] enabled debug-dev because of temporary install',
        details
      );
    }
  }
}
