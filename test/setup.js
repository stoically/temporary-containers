global.preferencesTestSet = [
  {
    automaticMode: true,
    automaticModeNewTab: 'created'
  },
  {
    automaticMode: false,
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
const manifestPath = path.resolve(path.join(__dirname, '../build/manifest.json'));
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

const buildBackground = async () => {
  const webExtension = await webExtensionsJSDOM.fromManifest(manifestPath, {
    apiFake: true,
    sinon,
    background: {
      beforeParse(window) {
        window.browser._mochaTest = true;
      }
    }
  });
  webExtension.background.browser.tabs.query.resolves([{},{}]);
  webExtension.background.browser.storage.local.get.resolves({});
  webExtension.background.browser.contextualIdentities.get.resolves({});
  global.webExtension = webExtension;
  global.browser = webExtension.background.browser;

  if (process.argv[process.argv.length-1] === '--tmp-debug') {
    webExtension.background.window.log.DEBUG = true;
  }

  global.background = global.webExtension.background.window.tmp;
  global.clock = sinon.useFakeTimers();
};

global.loadBareBackground = async () => {
  const background = global.background;
  await background.runtimeOnInstalled({
    reason: 'install'
  });
  return background;
};

global.loadBackground = async (preferences = {}) => {
  const background = global.background;
  await background.runtimeOnInstalled({
    reason: 'install'
  });
  await background.initialize();
  Object.assign(background.storage.local.preferences, preferences);
  background.storage.local.preferences.linkClickGlobal.middle.action = 'always';
  background.storage.local.preferences.linkClickGlobal.ctrlleft.action = 'always';
  return background;
};


beforeEach(async () => {
  await buildBackground();
});

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
