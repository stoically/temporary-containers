if (!process.listenerCount('unhandledRejection')) {
  process.on('unhandledRejection', r => {
    console.log('unhandledRejection', r);
  });
}
import path from 'path';
import webExtensionsJSDOM from 'webextensions-jsdom';
import chai from 'chai';
import sinonChai from 'sinon-chai';
import sinon from 'sinon';
import helper from './helper';

const preferencesTestSet = [
  {
    automaticMode: {
      active: false,
      newTab: 'created',
    },
  },
  {
    automaticMode: {
      active: true,
      newTab: 'created',
    },
  },
  {
    automaticMode: {
      active: true,
      newTab: 'navigation',
    },
  },
  {
    automaticMode: {
      active: false,
      newTab: 'navigation',
    },
  },
];

chai.should();
chai.use(sinonChai);

const manifestPath = path.resolve(
  path.join(__dirname, '../dist/manifest.json')
);
const expect = chai.expect;
const nextTick = (): Promise<void> => {
  return new Promise(resolve => {
    process.nextTick(resolve);
  });
};

let webExtension;
let browser;
let background;
let clock;

const buildWebExtension = async (
  build: { apiFake?: false } = { apiFake: false }
) => {
  clock = sinon.useFakeTimers({
    toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval'],
  });
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

          window._mochaTest = true;
        },
      },
    },
  });
  webExtension.background.browser.runtime.getManifest.returns({
    version: '0.1',
  });
  webExtension.background.browser.runtime.getBrowserInfo.resolves({
    name: 'Firefox',
    version: 67,
  });

  webExtension.background.browser.permissions.getAll.resolves({
    permissions: [],
  });
  if (!build.apiFake) {
    webExtension.background.browser.tabs.query.resolves([
      { id: 1, url: 'fake' },
      { id: 2, url: 'fake' },
    ]);
    webExtension.background.browser.storage.local.get.resolves({});
    webExtension.background.browser.contextualIdentities.get.resolves({});
    webExtension.background.browser.cookies.getAll.resolves([]);
  }
  webExtension.background.browser.management.getAll.resolves([
    {
      id: '@testpilot-containers',
      enabled: true,
      version: '6.0.0',
    },
  ]);

  if (process.argv.includes('--tmp-debug')) {
    webExtension.background.window.log.DEBUG = true;
  }

  return webExtension;
};

const loadBareBackground = async (preferences = {}, build = {}) => {
  webExtension = await buildWebExtension(build);
  browser = webExtension.background.browser;
  background = webExtension.background.window.tmp;
  Object.assign(background.preferences.defaults, preferences);
  return background;
};

const loadBackground = async (preferences = {}) => {
  const webExtension = await buildWebExtension();
  browser = webExtension.background.browser;
  background = webExtension.background.window.tmp;

  await background.initialize();
  if (preferences) {
    Object.assign(background.storage.local.preferences, preferences);
    // eslint-disable-next-line require-atomic-updates
    background.storage.local.preferences.isolation.global.mouseClick.middle.action =
      'always';
    // eslint-disable-next-line require-atomic-updates
    background.storage.local.preferences.isolation.global.mouseClick.ctrlleft.action =
      'always';
  }
  return background;
};

const loadUninstalledBackground = async () => {
  const webExtension = await buildWebExtension();
  browser = webExtension.background.browser;
  background = webExtension.background.window.tmp;

  return background;
};

afterEach(() => {
  sinon.restore();
  if (webExtension && webExtension.background) {
    webExtension.background.destroy();
    webExtension = null;
  }
  if (background) {
    background = null;
  }
  if (browser) {
    browser = null;
  }
  if (clock) {
    clock.restore();
    clock = null;
  }
});

// TODO: since parceljs writes multiple times into dist, we need an
// arbitrary delay here. a parcel plugin could maybe solve that?
// or get rid of jsdom for now and run tests directly against src/?
if (run) {
  setTimeout(run, 500);
}

export {
  preferencesTestSet,
  sinon,
  expect,
  nextTick,
  helper,
  loadBareBackground,
  loadBackground,
  browser,
  background,
};
