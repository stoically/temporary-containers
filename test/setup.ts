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

if (!process.listenerCount('unhandledRejection')) {
  process.on('unhandledRejection', (r) => {
    console.log('unhandledRejection', r);
  });
}

import chai from 'chai';
import chaiDeepMatch from 'chai-deep-match';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import browserFake, { BrowserFake } from 'webextensions-api-fake';
import jsdom from 'jsdom';
import { TemporaryContainers } from '~/background/tmp';
import { Helper } from './helper';

const virtualConsole = new jsdom.VirtualConsole();
virtualConsole.sendTo(console);
virtualConsole.on('jsdomError', (error) => {
  // eslint-disable-next-line no-console
  console.error(error);
});

const fakeBrowser = (): {
  browser: BrowserFake;
  clock: sinon.SinonFakeTimers;
} => {
  const clock = sinon.useFakeTimers({
    toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval'],
  });
  const html = '<!DOCTYPE html><html><head></head><body></body></html>';

  const dom = new jsdom.JSDOM(html, {
    url: 'https://localhost',
    virtualConsole,
  });
  const window = dom.window as jsdom.DOMWindow;

  global.document = window.document;
  // FIXME
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  global.window = window;
  global.AbortController = window.AbortController;

  const browser = browserFake();
  global.window._mochaTest = true;
  // FIXME
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  global.browser = browser;
  global.browser.runtime.getManifest.returns({
    version: '0.1',
  });
  global.browser.runtime.getBrowserInfo.resolves({
    name: 'Firefox',
    version: 67,
  });
  global.browser.permissions.getAll.resolves({
    permissions: [],
  });
  global.browser.management.getAll.resolves([
    {
      id: '@testpilot-containers',
      enabled: true,
      version: '6.0.0',
    },
  ]);

  // FIXME add to webextensions-api-fake
  global.browser.privacy = {
    network: {
      networkPredictionEnabled: {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        set: sinon.stub(),
      },
    },
  };

  return { browser, clock };
};

chai.should();
chai.use(chaiDeepMatch);
chai.use(sinonChai);

const { expect } = chai;
const nextTick = (): Promise<void> => {
  return new Promise((resolve) => {
    process.nextTick(resolve);
  });
};

export interface Background {
  browser: BrowserFake;
  tmp: TemporaryContainers;
  clock: sinon.SinonFakeTimers;
  helper: Helper;
}

const loadBackground = async ({
  initialize = true,
  preferences = false,
  beforeCtor = false,
}: {
  initialize?: boolean;
  preferences?: false | Record<string, unknown>;
  beforeCtor?:
    | false
    | ((
        browser: BrowserFake,
        clock: sinon.SinonFakeTimers
      ) => Promise<void> | void);
} = {}): Promise<Background> => {
  const { browser, clock } = fakeBrowser();

  if (beforeCtor) {
    await beforeCtor(browser, clock);
  }

  const background = new TemporaryContainers();
  global.window.tmp = background;

  if (preferences) {
    Object.assign(background.preferences.defaults, preferences);
  }

  if (process.argv.includes('--tmp-debug')) {
    background.log.DEBUG = true;
  }

  if (initialize) {
    await background.initialize();
  }

  return {
    browser,
    tmp: background,
    clock,
    helper: new Helper(browser, background),
  };
};

export {
  preferencesTestSet,
  sinon,
  expect,
  nextTick,
  loadBackground,
  BrowserFake,
};
