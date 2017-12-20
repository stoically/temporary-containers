class Log {
  constructor() {
    this.DEBUG = false;

    this.debug = this.debug.bind(this);
  }

  debug() {
    if (!this.DEBUG) {
      return;
    }
    // eslint-disable-next-line no-console
    console.log(...arguments);
  }
}

const log = new Log;

module.exports = {
  log,
  debug: log.debug
};
