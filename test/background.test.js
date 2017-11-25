const test = require('ava');
const chai = require('chai');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
chai.should();
chai.use(sinonChai);

const browser = global.browser = {
  runtime: {
    onInstalled: {
      addListener: sinon.spy()
    },
    onStartup: {
      addListener: sinon.stub()
    },
    onMessage: {
      addListener: sinon.stub()
    }
  },
  tabs: {
    onCreated: {
      addListener: sinon.stub()
    },
    onUpdated: {
      addListener: sinon.stub()
    },
    onRemoved: {
      addListener: sinon.stub()
    }
  }
};

test('register runtime event listeners', (t) => {
  require('../background');
  browser.runtime.onInstalled.addListener.should.have.been.calledOnce;
  browser.runtime.onStartup.addListener.should.have.been.calledOnce;
  browser.runtime.onMessage.addListener.should.have.been.calledOnce;
  t.pass();
});

test('register tabs event listeners', (t) => {
  require('../background');
  browser.tabs.onCreated.addListener.should.have.been.calledOnce;
  browser.tabs.onUpdated.addListener.should.have.been.calledOnce;
  browser.tabs.onRemoved.addListener.should.have.been.calledOnce;
  t.pass();
});
