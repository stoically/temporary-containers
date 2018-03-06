/* istanbul ignore next */
/* eslint-disable */
window.lib = {};

window.lib.delay = () => {
  // https://github.com/sindresorhus/delay
  // version 2.0.0

  // The MIT License (MIT)
  //
  // Copyright (c) Sindre Sorhus <sindresorhus@gmail.com> (sindresorhus.com)
  //
  // Permission is hereby granted, free of charge, to any person obtaining a copy
  // of this software and associated documentation files (the "Software"), to deal
  // in the Software without restriction, including without limitation the rights
  // to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
  // copies of the Software, and to permit persons to whom the Software is
  // furnished to do so, subject to the following conditions:
  //
  // The above copyright notice and this permission notice shall be included in
  // all copies or substantial portions of the Software.
  //
  // THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
  // IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
  // FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
  // AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
  // LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
  // OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
  // THE SOFTWARE.

  class CancelError extends Error {
  	constructor(message) {
  		super(message);
  		this.name = 'CancelError';
  	}
  }

  const createDelay = willResolve => (ms, value) => {
  	let timeoutId;
  	let internalReject;

  	const delayPromise = new Promise((resolve, reject) => {
  		internalReject = reject;

  		timeoutId = setTimeout(() => {
  			const settle = willResolve ? resolve : reject;
  			settle(value);
  		}, ms);
  	});

  	delayPromise.cancel = () => {
  		if (timeoutId) {
  			clearTimeout(timeoutId);
  			timeoutId = null;
  			internalReject(new CancelError('Delay canceled'));
  		}
  	};

  	return delayPromise;
  };

  const delay = createDelay(true);
  delay.reject = createDelay(false);
  delay.CancelError = CancelError;
  return delay;
}


window.lib.globToRegexp = () => {
  // --------------------------------------------------------------------------------
  // modified and simplified version of https://github.com/fitzgen/glob-to-regexp
  // version 0.4.0

  // Copyright (c) 2013, Nick Fitzgerald
  //
  // All rights reserved.
  //
  // Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:
  //
  //     Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
  //
  //     Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.
  //
  // THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

  const globToRegexp = (glob) => {
    if (typeof glob !== 'string') {
      throw new TypeError('Expected a string');
    }

    var str = String(glob);

    // The regexp we are building, as a string.
    var reStr = "";

    // RegExp flags (eg "i" ) to pass in to RegExp constructor.
    var flags = "i";

    var c;
    for (var i = 0, len = str.length; i < len; i++) {
      c = str[i];

      switch (c) {
      case "/":
      case "$":
      case "^":
      case "+":
      case ".":
      case "(":
      case ")":
      case "=":
      case "!":
      case "|":
      case ",":
        reStr += "\\" + c;
        break;

      case "*":
        reStr += ".*";
        break;

      default:
        reStr += c;
      }
    }

    return new RegExp('^' + reStr + '$', flags);
  };

  return globToRegexp;
};

window.lib.PQueue = () => {
  // https://github.com/sindresorhus/p-queue
  // version 2.3.0

  // MIT License
  //
  // Copyright (c) Sindre Sorhus <sindresorhus@gmail.com> (sindresorhus.com)
  //
  // Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
  //
  // The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
  //
  // THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
  // Port of lower_bound from http://en.cppreference.com/w/cpp/algorithm/lower_bound
  // Used to compute insertion index to keep queue sorted after insertion

  function lowerBound(array, value, comp) {
    let first = 0;
    let count = array.length;

    while (count > 0) {
      const step = (count / 2) | 0;
      let it = first + step;

      if (comp(array[it], value) <= 0) {
        first = ++it;
        count -= step + 1;
      } else {
        count = step;
      }
    }

    return first;
  }

  class PriorityQueue {
    constructor() {
      this._queue = [];
    }

    enqueue(run, opts) {
      opts = Object.assign({
        priority: 0
      }, opts);

      const element = {priority: opts.priority, run};

      if (this.size && this._queue[this.size - 1].priority >= opts.priority) {
        this._queue.push(element);
        return;
      }

      const index = lowerBound(this._queue, element, (a, b) => b.priority - a.priority);
      this._queue.splice(index, 0, element);
    }

    dequeue() {
      return this._queue.shift().run;
    }

    get size() {
      return this._queue.length;
    }
  }

  class PQueue {
    constructor(opts) {
      opts = Object.assign({
        concurrency: Infinity,
        autoStart: true,
        queueClass: PriorityQueue
      }, opts);

      if (!(typeof opts.concurrency === 'number' && opts.concurrency >= 1)) {
        throw new TypeError(`Expected \`concurrency\` to be a number from 1 and up, got \`${opts.concurrency}\` (${typeof opts.concurrency})`);
      }

      this.queue = new opts.queueClass(); // eslint-disable-line new-cap
      this._queueClass = opts.queueClass;
      this._pendingCount = 0;
      this._concurrency = opts.concurrency;
      this._isPaused = opts.autoStart === false;
      this._resolveEmpty = () => {};
      this._resolveIdle = () => {};
    }

    _next() {
      this._pendingCount--;

      if (!this._isPaused && this.queue.size > 0) {
        this.queue.dequeue()();
      } else {
        this._resolveEmpty();

        if (this._pendingCount === 0) {
          this._resolveIdle();
        }
      }
    }

    add(fn, opts) {
      return new Promise((resolve, reject) => {
        const run = () => {
          this._pendingCount++;

          fn().then(
            val => {
              resolve(val);
              this._next();
            },
            err => {
              reject(err);
              this._next();
            }
          );
        };

        if (!this._isPaused && this._pendingCount < this._concurrency) {
          run();
        } else {
          this.queue.enqueue(run, opts);
        }
      });
    }

    addAll(fns, opts) {
      return Promise.all(fns.map(fn => this.add(fn, opts)));
    }

    start() {
      if (!this._isPaused) {
        return;
      }

      this._isPaused = false;
      while (this.queue.size > 0 && this._pendingCount < this._concurrency) {
        this.queue.dequeue()();
      }
    }

    pause() {
      this._isPaused = true;
    }

    clear() {
      this.queue = new this._queueClass(); // eslint-disable-line new-cap
    }

    onEmpty() {
      // Instantly resolve if the queue is empty
      if (this.queue.size === 0) {
        return Promise.resolve();
      }

      return new Promise(resolve => {
        const existingResolve = this._resolveEmpty;
        this._resolveEmpty = () => {
          existingResolve();
          resolve();
        };
      });
    }

    onIdle() {
      // Instantly resolve if none pending
      if (this._pendingCount === 0) {
        return Promise.resolve();
      }

      return new Promise(resolve => {
        const existingResolve = this._resolveIdle;
        this._resolveIdle = () => {
          existingResolve();
          resolve();
        };
      });
    }

    get size() {
      return this.queue.size;
    }

    get pending() {
      return this._pendingCount;
    }

    get isPaused() {
      return this._isPaused;
    }
  }

  return PQueue;
};

window.lib.versionCompare = () => {
  // https://github.com/substack/semver-compare
  // https://github.com/substack/semver-compare/pull/4

  // This software is released under the MIT license:
  //
  // Permission is hereby granted, free of charge, to any person obtaining a copy of
  // this software and associated documentation files (the "Software"), to deal in
  // the Software without restriction, including without limitation the rights to
  // use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
  // the Software, and to permit persons to whom the Software is furnished to do so,
  // subject to the following conditions:
  //
  // The above copyright notice and this permission notice shall be included in all
  // copies or substantial portions of the Software.
  //
  // THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
  // IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
  // FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
  // COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
  // IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
  // CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

  const versionCompare = function cmp (a, b) {
    var pa = a.split('.');
    var pb = b.split('.');
    for (var i = 0; i < Math.min(pa.length, pb.length); i++) {
      var na = Number(pa[i]);
      var nb = Number(pb[i]);
      if (na > nb) return 1;
      if (nb > na) return -1;
      if (!isNaN(na) && isNaN(nb)) return 1;
      if (isNaN(na) && !isNaN(nb)) return -1;
    }
    return 0;
  };

  return versionCompare;
};

window.delay = window.lib.delay();
window.globToRegexp = window.lib.globToRegexp();
window.versionCompare = window.lib.versionCompare();
window.PQueue = window.lib.PQueue();