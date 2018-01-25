const chai = require('chai');
const sinonChai = require('sinon-chai');
global.reload = require('require-reload')(require);
global.sinon = require('sinon');
global.expect = chai.expect;
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
    windows: {
      onFocusChanged: {
        addListener: sinon.stub(),
      }
    },
    tabs: {
      onActivated: {
        addListener: sinon.stub()
      },
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
      query: sinon.stub().resolves([{},{}]),
      get: sinon.stub()
    },
    storage: {
      local: {
        get: sinon.stub().resolves({}),
        set: sinon.stub()
      }
    },
    contextualIdentities: {
      create: sinon.stub(),
      get: sinon.stub().resolves({})
    },
    browserAction: {
      onClicked: {
        addListener: sinon.stub()
      }
    },
    contextMenus: {
      create: sinon.stub(),
      removeAll: sinon.stub(),
      onClicked: {
        addListener: sinon.stub()
      }
    },
    commands: {
      onCommand: {
        addListener: sinon.stub()
      }
    }
  };
};

global.loadBackground = async () => {
  const background = reload('../src/background');
  await background.initialize();
  return background;
};

beforeEach(() => {
  global.clock = sinon.useFakeTimers();
  injectBrowser();
});

afterEach(() => {
  clock.reset();
});
