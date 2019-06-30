class ConditionalCall {
  constructor({condition, func, timeout, debug = false, name = ''}) {
    this._condition = condition;
    this._func = func;
    this._timeout = timeout || 5000;
    this._name = name;

    this._timedOut = false;
    this._aborted = false;
    this._abortController = new AbortController();
    this._met = false;
    this._promise = new Promise((resolve, reject) => {
      this.met = () => {
        if (this._met) {
          return;
        }
        this._debug('condition met, executing all calls');
        this._met = true;
        resolve();
      };

      this.abort = () => {
        this._debug('aborting, canceling all calls');
        this._aborted = true;
        reject();
      };

      this._abortController.signal.addEventListener('abort', () => {
        this._debug('timed out, canceling all calls with unmet condition');
        this._timedOut = true;
        reject();
      });
    });

    this._debug = (message) => {
      if (debug) {
        debug('[conditional-call]', name, message, this._func, this._timeout);
      }
    };

    this.func = this.func.bind(this);
  }

  async func() {
    if (this._aborted) {
      return;
    }

    if (!this._met) {
      if (!this._condition()) {
        await this._waitForConditionMet();
      } else {
        this.met();
      }
    }

    return this._func.call(this, ...arguments);
  }

  async _waitForConditionMet() {
    this._debug('condition unmet');

    if (this._timedOut) {
      this._debug('timed out before, canceling call');
      return;
    }

    const abortTimeout = setTimeout(() => {
      this._debug('timed out, aborting call');
      this._abortController.abort();
    }, this._timeout);

    this._debug('waiting until condition is met before calling');
    await this._promise;
    clearTimeout(abortTimeout);
  }
}

window.ConditionalCall = ConditionalCall;