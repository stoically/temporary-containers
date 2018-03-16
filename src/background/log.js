/* eslint-disable no-console */

class Log {
  constructor() {
    this.DEBUG = false;
    this.temporary = false;

    this.debug = this.debug.bind(this);
  }

  debug(...args) {
    if (!this.DEBUG) {
      return;
    }
    if (!browser._mochaTest && !this.temporary) {
      console.log(...args.map(JSON.stringify));
      console.trace();
    } else {
      console.log(...args.slice(0));
    }
  }
}

window.log = new Log;
// eslint-disable-next-line
window.debug = log.debug;