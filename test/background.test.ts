import {
  sinon,
  preferencesTestSet,
  expect,
  nextTick,
  loadBackground,
  Background,
} from './setup';
import { Tab } from '~/types';

preferencesTestSet.map(preferences => {
  describe(`preferences: ${JSON.stringify(preferences)}`, () => {
    it('should register event listeners', async () => {
      const { browser, tmp: background } = await loadBackground({
        initialize: false,
        preferences,
      });
      sinon.stub(background.runtime, 'onStartup');
      sinon.stub(background.runtime, 'onMessage');
      sinon.stub(background.commands, 'onCommand');
      sinon.stub(background.contextmenu, 'onClicked');
      sinon.stub(background.contextmenu, 'windowsOnFocusChanged');
      sinon.stub(background.tabs, 'onCreated');
      sinon.stub(background.tabs, 'onUpdated');
      sinon.stub(background.tabs, 'onRemoved');
      sinon.stub(background.tabs, 'onActivated');
      sinon.stub(background.container, 'createTabInTempContainer');
      sinon.stub(background.request, 'webRequestOnBeforeRequest');
      await background.initialize();

      browser.browserAction.onClicked.addListener.yield();
      background.container.createTabInTempContainer.should.have.been.calledOnce;

      browser.contextMenus.onClicked.addListener.yield();
      background.contextmenu.onClicked.should.have.been.calledOnce;

      browser.commands.onCommand.addListener.yield();
      background.commands.onCommand.should.have.been.calledOnce;

      browser.runtime.onStartup.addListener.should.have.been.calledOnce;
      browser.runtime.onMessage.addListener.should.have.been.calledOnce;

      browser.windows.onFocusChanged.addListener.yield();
      background.contextmenu.windowsOnFocusChanged.should.have.been.calledOnce;

      browser.tabs.onCreated.addListener.yield();
      background.tabs.onCreated.should.have.been.calledOnce;

      browser.tabs.onUpdated.addListener.yield();
      background.tabs.onUpdated.should.have.been.calledOnce;

      browser.tabs.onRemoved.addListener.yield();
      background.tabs.onRemoved.should.have.been.calledOnce;

      browser.tabs.onActivated.addListener.yield();
      background.tabs.onActivated.should.have.been.calledOnce;

      browser.webRequest.onBeforeRequest.addListener.yield();
      background.request.webRequestOnBeforeRequest.should.have.been.calledOnce;
    });

    it('should have registered a container cleanup interval', async () => {
      const { tmp: background, clock } = await loadBackground({
        initialize: false,
        preferences,
      });
      sinon.stub(background.cleanup, 'cleanup');
      await background.initialize();
      clock.tick(600000);
      background.cleanup.cleanup.should.have.been.calledOnce;
    });

    describe('should catch early requests', () => {
      it('wait for tmp to initialize, blocking the request until initialize', async () => {
        const { tmp: background, browser } = await loadBackground({
          initialize: false,
          preferences,
        });
        sinon.stub(background.request, 'webRequestOnBeforeRequest');

        browser.tabs._create({ url: 'https://example.com' });
        await nextTick();
        background.request.webRequestOnBeforeRequest.should.not.have.been
          .called;

        await background.initialize();
        background.request.webRequestOnBeforeRequest.should.have.been.called;
      });

      it('wait for tmp to initialize, blocking the request until timeout and dont block the next requests anymore', async () => {
        const { tmp: background, browser } = await loadBackground({
          initialize: false,
          preferences,
        });

        const webRequestOnBeforeRequestStub = sinon.stub(
          background.request,
          'webRequestOnBeforeRequest'
        );
        browser.tabs._create({ url: 'https://example.com' });
        await nextTick();
        webRequestOnBeforeRequestStub.should.not.have.been.called;

        await background.initialize();

        webRequestOnBeforeRequestStub.should.have.been.called;
        webRequestOnBeforeRequestStub.resetHistory();

        await browser.tabs._create({ url: 'https://example.com' });
        webRequestOnBeforeRequestStub.should.have.been.called;
      });
    });

    describe('initialize should sometimes reload already open Tab in Temporary Container', () => {
      if (
        !preferences.automaticMode.active ||
        preferences.automaticMode.newTab === 'navigation'
      ) {
        return;
      }

      it('one open about:home should reopen in temporary container', async () => {
        const { browser } = await loadBackground({
          preferences,
          beforeCtor: async (browser): Promise<void> => {
            await browser.tabs._create({ url: 'about:home' });
          },
        });

        browser.contextualIdentities.create.should.have.been.calledOnce;
        browser.tabs.remove.should.have.been.calledOnce;
      });

      it('one open tab not in the default container should not reopen in temporary container', async () => {
        const { browser } = await loadBackground({
          preferences,
          beforeCtor: async (browser): Promise<void> => {
            await browser.tabs._create({
              url: 'about:home',
              cookieStoreId: 'firefox-container-1',
            });
          },
        });

        browser.contextualIdentities.create.should.not.have.been.called;
      });
    });

    describe('tabs loading about:home or about:newtab in the default container', () => {
      if (
        !preferences.automaticMode.active ||
        preferences.automaticMode.newTab === 'navigation'
      ) {
        return;
      }
      it('should reopen about:home in temporary container', async () => {
        const { browser } = await loadBackground({ preferences });
        await browser.tabs._create({ url: 'about:home' });
        browser.tabs.create.should.have.been.calledOnce;
      });

      it('should reopen about:newtab in temporary container', async () => {
        const { browser } = await loadBackground({ preferences });
        await browser.tabs._create({ url: 'about:newtab' });
        browser.tabs.create.should.have.been.calledOnce;
      });
    });

    describe('tabs loading URLs in default-container', () => {
      if (!preferences.automaticMode.active) {
        return;
      }
      let bg: Background;
      beforeEach(async () => {
        bg = await loadBackground({ preferences });
        await bg.browser.tabs._create({ url: 'https://example.com' });
      });

      it('should reopen the Tab in temporary container', async () => {
        bg.browser.contextualIdentities.create.should.have.been.calledOnce;
        bg.browser.tabs.create.should.have.been.calledOnce;
      });
    });

    describe('tabs requesting something in non-default and non-temporary containers', () => {
      it('should not be interrupted', async () => {
        const { browser } = await loadBackground({ preferences });
        await browser.tabs._create({
          url: 'https://example.com',
          cookieStoreId: 'firefox-container-1',
        });

        browser.contextualIdentities.create.should.not.have.been.called;
        browser.tabs.create.should.not.have.been.called;
        browser.tabs.remove.should.not.have.been.called;
      });
    });

    describe('tabs requesting a previously clicked url in a temporary container', () => {
      if (!preferences.automaticMode.active) {
        return;
      }

      let tab: Tab | undefined;
      let webExtension: Background;
      beforeEach(async () => {
        webExtension = await loadBackground({ preferences });
        webExtension.tmp.storage.local.preferences.isolation.global.mouseClick.middle.action =
          'always';

        tab = (await webExtension.helper.createTmpTab({
          url: 'https://notexample.com',
        })) as Tab;

        const url = 'https://example.com';
        await webExtension.helper.clickLink(url, tab);

        await webExtension.browser.tabs._create({
          url: 'https://example.com',
          openerTabId: tab?.id,
          cookieStoreId: tab?.cookieStoreId,
        });
      });

      it('should open in a new temporary container', async () => {
        webExtension.browser.contextualIdentities.create.should.have.been
          .calledOnce;
        webExtension.browser.tabs.create.should.have.been.calledOnce;
        webExtension.browser.tabs.remove.should.have.been.calledOnce;
      });

      describe('follow-up request', () => {
        beforeEach(async () => {
          webExtension.helper.resetHistory();
          await webExtension.browser.tabs._create({
            url: 'https://example.com',
            openerTabId: tab?.id,
            cookieStoreId: tab?.cookieStoreId,
          });
        });

        it('should not trigger reopening in temporary container', () => {
          webExtension.browser.contextualIdentities.create.should.not.have.been
            .called;
          webExtension.browser.tabs.create.should.not.have.been.called;
        });
      });
    });

    describe('state for clicked links', async () => {
      it('should be cleaned up', async () => {
        const bg = await loadBackground({
          preferences,
        });
        bg.tmp.storage.local.preferences.isolation.global.mouseClick.middle.action =
          'always';

        const tab = (await bg.browser.tabs._create({
          url: 'https://notexample.com',
        })) as Tab;

        const url = 'https://example.com';
        await bg.helper.clickLink(url, tab);
        expect(bg.tmp.mouseclick.isolated[url]).to.exist;

        bg.clock.tick(1500);
        await new Promise(process.nextTick);
        expect(bg.tmp.mouseclick.isolated).to.deep.equal({});
      });
    });

    describe('runtime.onMessage savePreferences', () => {
      it('should save the given preferences to storage.local', async () => {
        const { tmp: background, browser } = await loadBackground({
          preferences,
        });
        const fakeMessage = {
          method: 'savePreferences',
          payload: {
            preferences: {
              ...background.storage.local.preferences,
              automaticMode: true,
            },
          },
        };
        await background.runtime.onMessage(fakeMessage, {});
        browser.storage.local.set.should.have.been.calledWithMatch({
          preferences: {
            automaticMode: true,
          },
        });
      });
    });

    describe('commands', () => {
      describe('New Temporary Container Tab', () => {
        it('should open a new temporary container tab', async () => {
          const { browser } = await loadBackground({ preferences });
          browser.commands.onCommand.addListener.yield(
            'new_temporary_container_tab'
          );
          await nextTick();
          browser.tabs.create.should.have.been.called;
        });
      });

      describe('New No Container Tab', () => {
        it('should open a new no container tab', async () => {
          const { tmp: background, browser } = await loadBackground({
            preferences,
          });
          background.storage.local.preferences.keyboardShortcuts.AltN = true;
          browser.commands.onCommand.addListener.yield('new_no_container_tab');
          await nextTick();
          browser.tabs.create.should.have.been.calledWith({
            url: 'about:blank',
          });
        });
      });

      describe('New No Container Window Tab', () => {
        it('should open a new no container window', async () => {
          const { tmp: background, browser } = await loadBackground({
            preferences,
          });
          background.storage.local.preferences.keyboardShortcuts.AltShiftC = true;
          browser.commands.onCommand.addListener.yield(
            'new_no_container_window_tab'
          );
          await nextTick();
          browser.windows.create.should.have.been.calledWith({
            url: 'about:blank',
          });
        });
      });

      describe('New Deletes History Container Tab', () => {
        it('should open a new deletes history container tab', async () => {
          const { tmp: background, browser } = await loadBackground({
            preferences,
          });
          background.permissions.history = true;
          browser.commands.onCommand.addListener.yield('new_no_history_tab');
          await nextTick();
          browser.tabs.create.should.have.been.called;
          browser.contextualIdentities.create.should.have.been.calledWithMatch({
            name: sinon.match('-deletes-history'),
          });
        });
      });

      describe('New Same Container Tab', () => {
        it('should open a new same container tab', async () => {
          const { tmp: background, browser } = await loadBackground({
            preferences,
          });
          background.storage.local.preferences.keyboardShortcuts.AltX = true;
          const container = await browser.contextualIdentities.create({});
          await browser.tabs._create({
            cookieStoreId: container.cookieStoreId,
          });
          browser.commands.onCommand.addListener.yield(
            'new_same_container_tab'
          );
          await nextTick();
          browser.tabs.create.should.have.been.calledWithMatch({
            cookieStoreId: container.cookieStoreId,
          });
        });
      });
    });

    describe('Reuse container number', () => {
      if (
        !preferences.automaticMode.active ||
        preferences.automaticMode.newTab === 'navigation'
      ) {
        return;
      }

      it('should work when multiple tabs are opened', async () => {
        const { tmp: background, browser } = await loadBackground({
          preferences,
        });
        background.storage.local.preferences.container.numberMode = 'reuse';
        const tabPromises = [];
        for (let i = 0; i < 5; i++) {
          tabPromises.push(browser.tabs._create({ url: 'about:newtab' }));
        }
        await Promise.all(tabPromises);
        const tabs = await browser.tabs.query({});
        const containerPromises = tabs.map((tab: Tab) =>
          browser.contextualIdentities.get(tab.cookieStoreId)
        );
        const containers = await Promise.all(containerPromises);
        for (let i = 0; i < 5; i++) {
          const container = containers[
            i
          ] as browser.contextualIdentities.ContextualIdentity;
          container.name.should.equal(`tmp${i + 1}`);
        }

        await browser.tabs.remove(tabs[0].id);
        await background.cleanup.cleanup(true);
        await new Promise(process.nextTick);
        await browser.tabs._create({ url: 'about:newtab' });
        (
          await browser.contextualIdentities.get(
            (await browser.tabs.create.lastCall.returnValue).cookieStoreId
          )
        ).name.should.equal('tmp1');
        await browser.tabs._create({ url: 'about:newtab' });
        (
          await browser.contextualIdentities.get(
            (await browser.tabs.create.lastCall.returnValue).cookieStoreId
          )
        ).name.should.equal('tmp6');
      });
    });
  });
});
