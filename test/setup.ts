if (!process.listenerCount('unhandledRejection')) {
  process.on('unhandledRejection', r => {
    console.log('unhandledRejection', r);
  });
}

import chai from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import { Tab } from '~/types';
import { AbortController } from 'abort-controller';
import browserFake from 'webextensions-api-fake';

global.window = {
  _mochaTest: true,
  setTimeout: setTimeout,
};
global.browser = browserFake();
global.browser.contextMenus = global.browser.menus;
global.browser.contextMenus.onShown = {
  addListener: sinon.stub(),
};
global.AbortController = AbortController;

import { TemporaryContainers } from '../src/background';

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

const { expect } = chai;
const nextTick = (): Promise<void> => {
  return new Promise(resolve => {
    process.nextTick(resolve);
  });
};

const clock = sinon.useFakeTimers({
  toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval'],
});

export interface WebExtension {
  browser: any;
  background: TemporaryContainers;
  window: any;
}

const buildWebExtension = async (
  build: { apiFake?: false } = { apiFake: false }
) => {
  const background = new TemporaryContainers();
  const webExtension = {
    browser: browserFake(),
    background,
    window,
  };

  webExtension.browser.runtime.getManifest.returns({
    version: '0.1',
  });
  webExtension.browser.runtime.getBrowserInfo.resolves({
    name: 'Firefox',
    version: 67,
  });

  webExtension.browser.permissions.getAll.resolves({
    permissions: [],
  });
  if (!build.apiFake) {
    webExtension.browser.tabs.query.resolves([
      { id: 1, url: 'fake' },
      { id: 2, url: 'fake' },
    ]);
    webExtension.browser.storage.local.get.resolves({});
    webExtension.browser.contextualIdentities.get.resolves({});
    webExtension.browser.cookies.getAll.resolves([]);
  }
  webExtension.browser.management.getAll.resolves([
    {
      id: '@testpilot-containers',
      enabled: true,
      version: '6.0.0',
    },
  ]);

  if (process.argv.includes('--tmp-debug')) {
    webExtension.window.log.DEBUG = true;
  }

  return webExtension;
};

const loadBareBackground = async (
  preferences = {},
  build = {}
): Promise<WebExtension> => {
  const webExtension = await buildWebExtension(build);
  const { background } = webExtension;
  Object.assign(background.preferences.defaults, preferences);
  return webExtension;
};

const loadBackground = async (preferences = {}): Promise<WebExtension> => {
  const webExtension = await buildWebExtension();
  const { background } = webExtension;

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
  return webExtension;
};

const loadUninstalledBackground = async (): Promise<WebExtension> => {
  const webExtension = await buildWebExtension();

  return webExtension;
};

afterEach(() => {
  sinon.restore();
  clock.restore();
});

export {
  preferencesTestSet,
  sinon,
  expect,
  nextTick,
  loadBareBackground,
  loadBackground,
  loadUninstalledBackground,
  clock,
};
