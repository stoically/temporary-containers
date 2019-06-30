/* eslint-disable no-console */

class Log {
  constructor() {
    this.DEBUG = false;
    this.stringify = true;

    this.debug = this.debug.bind(this);

    if (window.localStorage.getItem('debug')) {
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

window.log = new Log;
// eslint-disable-next-line
window.debug = log.debug;
