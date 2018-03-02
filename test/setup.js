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
  global.browser = require('./browser.mock')();
};

global.loadBareBackground = async () => {
  const background = reload('../src/background');
  await background.runtimeOnInstalled({
    reason: 'install'
  });
  return background;
};

global.loadBackground = async (preferences = {}) => {
  const background = reload('../src/background');
  await background.runtimeOnInstalled({
    reason: 'install'
  });
  await background.initialize();
  Object.assign(background.storage.local.preferences, preferences);
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
