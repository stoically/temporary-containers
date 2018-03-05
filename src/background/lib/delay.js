/* istanbul ignore next */
/* eslint-disable */

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

window.lib.delay = () => {
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
