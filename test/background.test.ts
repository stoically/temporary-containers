import {
  sinon,
  preferencesTestSet,
  loadBareBackground,
  expect,
  nextTick,
  loadBackground,
  clock,
  WebExtension,
  tab,
} from './setup';
import { TemporaryContainers } from '~/background';
import { Tab } from '~/types';

preferencesTestSet.map(preferences => {
  describe(`preferences: ${JSON.stringify(preferences)}`, () => {
    describe('on require', () => {
      it('should register event listeners', async () => {
        const { browser, background } = await loadBareBackground(preferences);
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
        background.container.createTabInTempContainer.should.have.been
          .calledOnce;

        browser.contextMenus.onClicked.addListener.yield();
        background.contextmenu.onClicked.should.have.been.calledOnce;

        browser.commands.onCommand.addListener.yield();
        background.commands.onCommand.should.have.been.calledOnce;

        browser.runtime.onInstalled.addListener.should.have.been.calledTwice;
        browser.runtime.onStartup.addListener.should.have.been.calledOnce;
        browser.runtime.onMessage.addListener.should.have.been.calledOnce;

        browser.windows.onFocusChanged.addListener.yield();
        background.contextmenu.windowsOnFocusChanged.should.have.been
          .calledOnce;

        browser.tabs.onCreated.addListener.yield();
        background.tabs.onCreated.should.have.been.calledOnce;

        browser.tabs.onUpdated.addListener.yield();
        background.tabs.onUpdated.should.have.been.calledOnce;

        browser.tabs.onRemoved.addListener.yield();
        background.tabs.onRemoved.should.have.been.calledOnce;

        browser.tabs.onActivated.addListener.yield();
        background.tabs.onActivated.should.have.been.calledOnce;

        browser.webRequest.onBeforeRequest.addListener.yield();
        background.request.webRequestOnBeforeRequest.should.have.been
          .calledOnce;
      });

      it('should have registered a container cleanup interval', async () => {
        const { background } = await loadBareBackground(preferences);
        sinon.stub(background.cleanup, 'cleanup');
        await background.initialize();
        clock.tick(600000);
        background.cleanup.cleanup.should.have.been.calledOnce;
      });

      describe('should catch early requests', () => {
        it('wait for tmp to initialize, blocking the request until initialize', async () => {
          const { background, browser } = await loadBareBackground(preferences);
          sinon.stub(background.request, 'webRequestOnBeforeRequest');

          const [
            promise,
          ] = browser.webRequest.onBeforeRequest.addListener.yield({
            requestId: 1,
          });
          let promiseFulfilled = false;
          promise.then(() => (promiseFulfilled = true));
          clock.tick(500);
          await new Promise(process.nextTick);
          expect(promiseFulfilled).to.be.false;
          await background.initialize();
          await new Promise(process.nextTick);
          expect(promiseFulfilled).to.be.true;
          background.request.webRequestOnBeforeRequest.should.have.been.called;
        });

        it('wait for tmp to initialize, blocking the request until timeout and dont block the next requests anymore', async () => {
          const { background, browser } = await loadBareBackground(preferences);
          sinon.stub(background.request, 'webRequestOnBeforeRequest');

          const [
            promise,
          ] = browser.webRequest.onBeforeRequest.addListener.yield({
            requestId: 1,
          });
          let promiseRejected = false;
          promise.catch(() => (promiseRejected = true));
          expect(promiseRejected).to.be.false;
          clock.tick(5001);
          await new Promise(process.nextTick);
          expect(promiseRejected).to.be.true;
          background.request.webRequestOnBeforeRequest.should.not.have.been
            .called;

          const [
            promise2,
          ] = browser.webRequest.onBeforeRequest.addListener.yield({
            requestId: 1,
          });
          return promise2.catch(() => {
            background.request.webRequestOnBeforeRequest.should.not.have.been
              .called;
          });
        });
      });
    });

    describe('initialize should sometimes reload already open Tab in Temporary Container', () => {
      if (
        !preferences.automaticMode.active ||
        preferences.automaticMode.newTab === 'navigation'
      ) {
        return;
      }
      const fakeContainer = {
        cookieStoreId: 'fake',
      };

      it('one open about:home should reopen in temporary container', async () => {
        const { background, browser } = await loadBareBackground(preferences);
        const fakeAboutHomeTab = {
          cookieStoreId: 'firefox-default',
          url: 'about:home',
        };

        browser.tabs.query.resolves([fakeAboutHomeTab]);
        browser.contextualIdentities.create.resolves(fakeContainer);
        browser.tabs.create.resolves({ id: 1 });
        await background.initialize();
        await nextTick();
        // eslint-disable-next-line require-atomic-updates
        background.storage.local.preferences.automaticMode.newTab = 'created';
        browser.contextualIdentities.create.should.have.been.calledOnce;
        browser.tabs.create.should.have.been.calledOnce;

        browser.tabs.query.resolves([{}, {}]);
        clock.tick(500);
        await nextTick();
        browser.tabs.remove.should.have.been.calledOnce;
      });

      it('one open tab not in the default container should not reopen in temporary container', async () => {
        const { background, browser } = await loadBareBackground(preferences);
        const fakeNotDefaultTab = {
          cookieStoreId: 'not-default',
          url: 'about:home',
        };
        browser.tabs.query.resolves([fakeNotDefaultTab]);
        await background.initialize();
        await nextTick();

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
        const { background, browser } = await loadBareBackground(preferences, {
          apiFake: true,
        });
        await background.initialize();
        await browser.tabs._create({ url: 'about:home' });
        browser.tabs.create.should.have.been.calledOnce;
      });

      it('should reopen about:newtab in temporary container', async () => {
        const { background, browser } = await loadBareBackground(preferences, {
          apiFake: true,
        });
        await background.initialize();
        await browser.tabs._create({ url: 'about:newtab' });
        browser.tabs.create.should.have.been.calledOnce;
      });
    });

    describe('tabs loading URLs in default-container', () => {
      if (!preferences.automaticMode.active) {
        return;
      }
      beforeEach(async () => {
        const { background, browser } = await loadBareBackground(preferences);
        await background.initialize();
        await browser.tabs.create({ url: 'https://example.com' });
      });

      it('should reopen the Tab in temporary container', async () => {
        browser.contextualIdentities.create.should.have.been.calledOnce;
        browser.tabs.create.should.have.been.calledOnce;
      });
    });

    describe('tabs requesting something in non-default and non-temporary containers', () => {
      it('should not be interrupted', async () => {
        const { background, browser } = await loadBareBackground(preferences);
        await background.initialize();
        await browser.tabs.create({
          url: 'https://example.com',
          cookieStoreId: 'firefox-container-permanent',
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

      let background: TemporaryContainers, fakeMessage;
      beforeEach(async () => {
        const webExtension = await loadBackground(preferences);
        const { browser } = webExtension;
        const tab = (await browser.tabs.create({
          cookieStoreId: 'firefox-tmp-container-1',
          url: 'https://notexample.com',
        })) as Tab;

        // simulate click
        const fakeSender = {
          tab,
        };
        fakeMessage = {
          method: 'linkClicked',
          payload: {
            href: 'https://example.com',
            event: {
              button: 1,
              ctrlKey: false,
            },
          },
        };

        background = webExtension.background;
        await background.runtime.onMessage(fakeMessage, fakeSender);

        await browser.tabs.create({
          url: 'https://example.com',
          openerTabId: 1,
          cookieStoreId: 'firefox-tmp-container-1',
        });
      });

      it('should open in a new temporary container', async () => {
        browser.contextualIdentities.create.should.have.been.calledOnce;
        browser.tabs.create.should.have.been.calledOnce;
        browser.tabs.remove.should.not.have.been.calledOnce;
      });

      describe('follow-up request', () => {
        beforeEach(async () => {
          await browser.tabs.create({
            url: 'https://example.com',
            openerTabId: 1,
            cookieStoreId: 'firefox-tmp-container-2',
          });
        });

        it('should not trigger reopening in temporary container', () => {
          browser.contextualIdentities.create.should.not.have.been.called;
          browser.tabs.create.should.not.have.been.called;
        });
      });
    });

    describe('state for clicked links', async () => {
      it('should be cleaned up', async () => {
        const webExtension = await loadBackground(preferences);
        const { background, browser } = webExtension;
        const tab = (await browser.tabs.create({
          cookieStoreId: 'firefox-tmp-container-1',
          url: 'https://notexample.com',
        })) as Tab;

        const fakeSender = { tab };
        const fakeMessage = {
          method: 'linkClicked',
          payload: {
            href: 'https://example.com',
            event: {
              button: 1,
              ctrlKey: false,
            },
          },
        };
        await background.runtime.onMessage(fakeMessage, fakeSender);
        expect(background.mouseclick.isolated[fakeMessage.payload.href]).to
          .exist;

        clock.tick(1500);
        await new Promise(process.nextTick);
        expect(background.mouseclick.isolated).to.deep.equal({});
      });
    });

    describe('runtime.onMessage savePreferences', () => {
      it('should save the given preferences to storage.local', async () => {
        const { background, browser } = await loadBackground(preferences);
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
          const { background, browser } = await loadBareBackground(
            preferences,
            {
              apiFake: true,
            }
          );
          await background.initialize();
          browser.commands.onCommand.addListener.yield(
            'new_temporary_container_tab'
          );
          await nextTick();
          browser.tabs.create.should.have.been.called;
        });
      });

      describe('New No Container Tab', () => {
        it('should open a new no container tab', async () => {
          const { background, browser } = await loadBareBackground(
            preferences,
            {
              apiFake: true,
            }
          );
          await background.initialize();
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
          const { background, browser } = await loadBareBackground(
            preferences,
            {
              apiFake: true,
            }
          );
          await background.initialize();
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
          const { background, browser } = await loadBareBackground(
            preferences,
            {
              apiFake: true,
            }
          );
          await background.initialize();
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
          const { background, browser } = await loadBareBackground(
            preferences,
            {
              apiFake: true,
            }
          );
          await background.initialize();
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
        const { background, browser } = await loadBareBackground(preferences, {
          apiFake: true,
        });
        await background.initialize();
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
