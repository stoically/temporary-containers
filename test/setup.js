global.preferencesTestSet = [
  {
    automaticMode: {
      active: false,
      newTab: 'created'
    }
  },
  {
    automaticMode: {
      active: true,
      newTab: 'created'
    }
  },
  {
    automaticMode: {
      active: true,
      newTab: 'navigation'
    }
  },
  {
    automaticMode: {
      active: false,
      newTab: 'navigation'
    }
  }
];

if (!process.listenerCount('unhandledRejection')) {
  // eslint-disable-next-line no-console
  process.on('unhandledRejection', r => {
    console.log('unhandledRejection', r);
  });
}
const path = require('path');
const webExtensionsJSDOM = require('webextensions-jsdom');
const manifestPath = path.resolve(path.join(__dirname, '../src/manifest.json'));
const chai = require('chai');
const sinonChai = require('sinon-chai');
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

const buildWebExtension = async (build = {}) => {
  global.clock = sinon.useFakeTimers({toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval']});
  const webExtension = await webExtensionsJSDOM.fromManifest(manifestPath, {
    sinon,
    apiFake: build.apiFake || undefined,
    background: {
      jsdom: {
        url: 'https://localhost',
        beforeParse(window) {
          window.browser.contextMenus.onShown = {
            addListener: sinon.stub(),
            removeListener: sinon.stub(),
          };

          window.browser._mochaTest = true;
        }
      }
    }
  });
  webExtension.background.browser.runtime.getManifest.returns({version: '0.1'});
  webExtension.background.browser.runtime.getBrowserInfo.resolves({name: 'Firefox', version: 67});

  webExtension.background.browser.permissions.getAll.resolves({permissions: []});
  if (!build.apiFake) {
    webExtension.background.browser.tabs.query.resolves([{},{}]);
    webExtension.background.browser.storage.local.get.resolves({});
    webExtension.background.browser.contextualIdentities.get.resolves({});
    webExtension.background.browser.cookies.getAll.resolves([]);
  }
  webExtension.background.browser.management.getAll.resolves([{
    id: '@testpilot-containers',
    enabled: true,
    version: '6.0.0'
  }]);

  if (process.argv.includes('--tmp-debug')) {
    webExtension.background.window.log.DEBUG = true;
  }

  return webExtension;
};

global.loadBareBackground = async (preferences = {}, build = {}) => {
  const webExtension = await buildWebExtension(build);
  global.webExtension = webExtension;
  global.browser = webExtension.background.browser;
  global.background = global.webExtension.background.window.tmp;
  const background = global.background;
  Object.assign(background.preferences.defaults, preferences);
  return background;
};

global.loadBackground = async (preferences = {}) => {
  const webExtension = await buildWebExtension();

  global.webExtension = webExtension;
  global.browser = webExtension.background.browser;
  global.background = global.webExtension.background.window.tmp;

  await background.initialize();
  if (preferences) {
    Object.assign(background.storage.local.preferences, preferences);
    // eslint-disable-next-line require-atomic-updates
    background.storage.local.preferences.isolation.global.mouseClick.middle.action = 'always';
    // eslint-disable-next-line require-atomic-updates
    background.storage.local.preferences.isolation.global.mouseClick.ctrlleft.action = 'always';
  }
  return background;
};

global.loadUninstalledBackground = async () => {
  const webExtension = await buildWebExtension();

  global.webExtension = webExtension;
  global.browser = webExtension.background.browser;
  global.background = global.webExtension.background.window.tmp;

  const background = global.background;
  return background;
};


afterEach(() => {
  sinon.restore();
  if (global.webExtension && global.webExtension.background) {
    global.webExtension.background.destroy();
    delete global.webExtension;
  }
  if (global.background) {
    delete global.background;
  }
  if (global.browser) {
    delete global.browser;
  }
  if (global.clock) {
    clock.restore();
  }
});
