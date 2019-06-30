/* eslint-disable */
window.lib = {};

/* istanbul ignore next */
window.lib.PCancelable = () => {
  // https://github.com/sindresorhus/p-cancelable
  // version 2.0.0

  // MIT License
  //
  // Copyright (c) Sindre Sorhus <sindresorhus@gmail.com> (sindresorhus.com)
  //
  // Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
  //
  // The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
  //
  // THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

  class CancelError extends Error {
    constructor(reason) {
      super(reason || 'Promise was canceled');
      this.name = 'CancelError';
    }

    get isCanceled() {
      return true;
    }
  }

  class PCancelable {
    static fn(userFn) {
      return (...arguments_) => {
        return new PCancelable((resolve, reject, onCancel) => {
          arguments_.push(onCancel);
          // eslint-disable-next-line promise/prefer-await-to-then
          userFn(...arguments_).then(resolve, reject);
        });
      };
    }

    constructor(executor) {
      this._cancelHandlers = [];
      this._isPending = true;
      this._isCanceled = false;
      this._rejectOnCancel = true;

      this._promise = new Promise((resolve, reject) => {
        this._reject = reject;

        const onResolve = value => {
          this._isPending = false;
          resolve(value);
        };

        const onReject = error => {
          this._isPending = false;
          reject(error);
        };

        const onCancel = handler => {
          if (!this._isPending) {
            throw new Error('The `onCancel` handler was attached after the promise settled.');
          }

          this._cancelHandlers.push(handler);
        };

        Object.defineProperties(onCancel, {
          shouldReject: {
            get: () => this._rejectOnCancel,
            set: boolean => {
              this._rejectOnCancel = boolean;
            }
          }
        });

        return executor(onResolve, onReject, onCancel);
      });
    }

    then(onFulfilled, onRejected) {
      // eslint-disable-next-line promise/prefer-await-to-then
      return this._promise.then(onFulfilled, onRejected);
    }

    catch(onRejected) {
      return this._promise.catch(onRejected);
    }

    finally(onFinally) {
      return this._promise.finally(onFinally);
    }

    cancel(reason) {
      if (!this._isPending || this._isCanceled) {
        return;
      }

      if (this._cancelHandlers.length > 0) {
        try {
          for (const handler of this._cancelHandlers) {
            handler();
          }
        } catch (error) {
          this._reject(error);
        }
      }

      this._isCanceled = true;
      if (this._rejectOnCancel) {
        this._reject(new CancelError(reason));
      }
    }

    get isCanceled() {
      return this._isCanceled;
    }
  }

  Object.setPrototypeOf(PCancelable.prototype, Promise.prototype);

  window.PCancelable = PCancelable;
};

window.lib.PCancelable();