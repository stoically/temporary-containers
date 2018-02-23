if (!process.listenerCount('unhandledRejection')) {
  // eslint-disable-next-line no-console
  process.on('unhandledRejection', r => console.log(r));
}
const chai = require('chai');
const sinonChai = require('sinon-chai');
global.reload = require('require-reload')(require);
global.sinon = require('sinon');
global.expect = chai.expect;
chai.should();
chai.use(sinonChai);
global.nextTick = () => {
  return new Promise(resolve => {
    process.nextTick(resolve);
  });
};

global.URL = require('url').URL;
global.helper = require('./helper');
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
      },
      onMessageExternal: {
        addListener: sinon.stub()
      },
      sendMessage: sinon.stub()
    },
    webRequest: {
      onBeforeRequest: {
        addListener: sinon.stub()
      },
      onCompleted: {
        addListener: sinon.stub()
      },
      onErrorOccurred: {
        addListener: sinon.stub()
      },
      onBeforeSendHeaders: {
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
      },
      setTitle: sinon.stub(),
      setBadgeBackgroundColor: sinon.stub(),
      setBadgeText: sinon.stub()
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
    },
    history: {
      deleteUrl: sinon.stub()
    },
    permissions: {
      contains: sinon.stub()
    },
    cookies: {
      onChanged: {
        addListener: sinon.stub()
      }
    },
    pageAction: {
      setIcon: sinon.stub(),
      hide: sinon.stub(),
      show: sinon.stub()
    }
  };
};

global.preferencesTestSet = [
  {
    automaticMode: true,
    automaticModeNewTab: 'navigation'
  },
  {
    automaticMode: true,
    automaticModeNewTab: 'created'
  },
  {
    automaticMode: false,
    automaticModeNewTab: 'navigation'
  },
  {
    automaticMode: false,
    automaticModeNewTab: 'created'
  }
];

global.loadBackground = async (preferences = {}) => {
  const background = reload('../src/background');
  await background.initialize();
  background.storage.local.preferences.automaticMode = preferences.automaticMode ? preferences.automaticMode : true;
  background.storage.local.preferences.automaticModeNewTab = preferences.automaticModeNewTab ? preferences.automaticModeNewTab : 'navigation';
  background.storage.local.preferences.linkClickGlobal.middle.action = 'always';
  background.storage.local.preferences.linkClickGlobal.ctrlleft.action = 'always';
  return background;
};

beforeEach(() => {
  global.clock = sinon.useFakeTimers();
  injectBrowser();
});

afterEach(() => {
  clock.reset();
});
