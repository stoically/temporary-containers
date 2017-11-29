global.reload = require('require-reload')(require);
global.chai = require('chai');
global.sinon = require('sinon');
global.clock = sinon.useFakeTimers();
global.expect = chai.expect;
global.sinonChai = require('sinon-chai');
chai.should();
chai.use(sinonChai);

global.URL = require('url').URL;
global.injectBrowser = () => {
  global.browser = {
    mochaTest: true,
    runtime: {
      onInstalled: {
        addListener: sinon.stub()
      },
      onStartup: {
        addListener: sinon.stub()
      },
      onMessage: {
        addListener: sinon.stub()
      }
    },
    webRequest: {
      onBeforeRequest: {
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
      },
      create: sinon.stub(),
      remove: sinon.stub(),
      query: sinon.stub(),
      get: sinon.stub()
    },
    storage: {
      local: {
        get: sinon.stub().resolves({}),
        set: sinon.stub()
      }
    },
    contextualIdentities: {
      create: sinon.stub()
    },
    browserAction: {
      onClicked: {
        addListener: sinon.stub()
      }
    },
    contextMenus: {
      create: sinon.stub(),
      onClicked: {
        addListener: sinon.stub()
      }
    },
    management: {
      onEnabled: {
        addListener: sinon.stub()
      }
    }
  };
};

global.loadBackground = async () => {
  const background = reload('../background');
  await background.initialize();
  return background;
};
