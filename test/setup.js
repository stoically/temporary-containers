global.preferencesTestSet = [
  {
    automaticMode: false,
    automaticModeNewTab: 'created'
  },
  {
    automaticMode: true,
    automaticModeNewTab: 'created'
  },
  {
    automaticMode: true,
    automaticModeNewTab: 'navigation'
  },
  {
    automaticMode: false,
    automaticModeNewTab: 'navigation'
  }
];

if (!process.listenerCount('unhandledRejection')) {
  // eslint-disable-next-line no-console
  process.on('unhandledRejection', r => console.log(r));
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
  const webExtension = await webExtensionsJSDOM.fromManifest(manifestPath, {
    sinon,
    apiFake: build.apiFake || undefined,
    background: {
      jsdom: {
        beforeParse(window) {
          window.browser._mochaTest = true;
        }
      }
    }
  });
  if (!build.apiFake) {
    webExtension.background.browser.tabs.query.resolves([{},{}]);
    webExtension.background.browser.storage.local.get.resolves({});
    webExtension.background.browser.contextualIdentities.get.resolves({});
  }

  if (process.argv[process.argv.length-1] === '--tmp-debug') {
    webExtension.background.window.log.DEBUG = true;
  }

  return webExtension;
};

global.loadBareBackground = async (preferences = {}, build = {}) => {
  const webExtension = await buildWebExtension(build);

  global.webExtension = webExtension;
  global.browser = webExtension.background.browser;
  global.background = global.webExtension.background.window.tmp;
  global.clock = sinon.useFakeTimers();

  const background = global.background;
  await background.runtimeOnInstalled({
    reason: 'install'
  });
  Object.assign(background.storage.local.preferences, preferences);
  return background;
};

global.loadBackground = async (preferences = {}) => {
  const webExtension = await buildWebExtension();

  global.webExtension = webExtension;
  global.browser = webExtension.background.browser;
  global.background = global.webExtension.background.window.tmp;
  global.clock = sinon.useFakeTimers();

  await background.runtimeOnInstalled({
    reason: 'install'
  });
  Object.assign(background.storage.local.preferences, preferences);
  background.storage.local.preferences.linkClickGlobal.middle.action = 'always';
  background.storage.local.preferences.linkClickGlobal.ctrlleft.action = 'always';
  await background.initialize();
  return background;
};

global.loadUninstalledBackground = async () => {
  const webExtension = await buildWebExtension();

  global.webExtension = webExtension;
  global.browser = webExtension.background.browser;
  global.background = global.webExtension.background.window.tmp;
  global.clock = sinon.useFakeTimers();

  const background = global.background;
  return background;
};


afterEach(() => {
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
