import { preferencesTestSet, loadBackground, nextTick } from './setup';
import { Tab } from '~/types';

preferencesTestSet.map(preferences => {
  describe(`preferences: ${JSON.stringify(preferences)}`, () => {
    describe('Container Cleanup', () => {
      describe('when timeout is given', () => {
        it('should remove the container after the given timeout', async () => {
          const {
            tmp: background,
            browser,
            helper,
            clock,
          } = await loadBackground({
            preferences,
          });
          background.storage.local.preferences.container.removal = 150000;
          await helper.openNewTmpTab({
            createsTabId: 2,
            createsContainer: 'firefox-tmp1',
          });

          browser.tabs.query.withArgs({}).resolves([{}, {}]);
          browser.tabs.query
            .withArgs({ cookieStoreId: 'firefox-tmp1' })
            .resolves([]);
          browser.contextualIdentities.remove.resolves({});

          browser.tabs.onRemoved.addListener.yield(2);
          await nextTick();
          clock.tick(150000);
          await nextTick();
          clock.tick(3000);
          await nextTick();

          browser.contextualIdentities.remove.should.have.been.calledOnce;
        });
      });

      describe('when no timeout is given', () => {
        it('should remove the container instantly', async () => {
          const { tmp: background, browser, helper } = await loadBackground({
            preferences,
          });
          background.storage.local.preferences.container.removal = 0;
          await helper.openNewTmpTab({
            createsTabId: 2,
            createsContainer: 'firefox-tmp1',
          });

          browser.tabs.query.withArgs({}).resolves([{}, {}]);
          browser.tabs.query
            .withArgs({ cookieStoreId: 'firefox-tmp1' })
            .resolves([]);
          browser.contextualIdentities.remove.resolves({});

          browser.tabs.onRemoved.addListener.yield(2);
          await nextTick();

          browser.contextualIdentities.remove.should.have.been.calledOnce;
        });
      });

      describe('when tmp container tab is removed', () => {
        describe('and its the last one', () => {
          it('should remove the container', async () => {
            const bg = await loadBackground({ preferences });
            bg.tmp.storage.local.preferences.container.removal = 0;
            await bg.browser.tabs._create({});
            const tab = (await bg.tmp.container.createTabInTempContainer(
              {}
            )) as Tab;
            await bg.tmp.tabs.remove(tab);

            bg.browser.contextualIdentities.remove.should.have.been.calledOnceWith(
              tab.cookieStoreId
            );
          });
        });

        describe('and its not the last one', () => {
          it('should not remove the container', async () => {
            const bg = await loadBackground({ preferences });
            bg.tmp.storage.local.preferences.container.removal = 0;
            await bg.browser.tabs._create({});
            const tab = (await bg.tmp.container.createTabInTempContainer(
              {}
            )) as Tab;
            await bg.browser.tabs._create({ cookieStoreId: tab.cookieStoreId });
            await bg.tmp.tabs.remove(tab);
            await nextTick();

            bg.browser.contextualIdentities.remove.should.not.have.been.calledOnceWith(
              tab.cookieStoreId
            );
          });
        });
      });

      describe('when multiple tmp container tabs are removed', () => {
        it('should wait a bit inbetween removing containers', async () => {
          const bg = await loadBackground({ preferences });
          bg.tmp.storage.local.preferences.container.removal = 0;
          await bg.browser.tabs._create({});
          const tab1 = (await bg.tmp.container.createTabInTempContainer(
            {}
          )) as Tab;
          const tab2 = (await bg.tmp.container.createTabInTempContainer(
            {}
          )) as Tab;
          bg.tmp.tabs.remove(tab1);
          bg.tmp.tabs.remove(tab2);
          await nextTick();

          bg.browser.contextualIdentities.remove.should.have.been.calledOnceWith(
            tab1.cookieStoreId
          );
          bg.browser.contextualIdentities.remove.resetHistory();

          bg.clock.tick(3000);
          await nextTick();

          bg.browser.contextualIdentities.remove.should.have.been.calledOnceWith(
            tab2.cookieStoreId
          );
        });
      });

      describe('on firefox startup', () => {
        it('should not remove container if about:sessionrestore tab is open', async () => {
          const bg = await loadBackground({ preferences });
          bg.tmp.storage.local.preferences.container.removal = 0;
          await bg.browser.tabs._create({ url: 'about:sessionrestore' });
          const tab = (await bg.tmp.container.createTabInTempContainer(
            {}
          )) as Tab;

          const stub = bg.browser.sinonSandbox.stub(
            bg.tmp.cleanup,
            'addToRemoveQueue'
          );
          await bg.tmp.tabs.remove(tab);
          stub.restore();
          await nextTick();
          await bg.tmp.cleanup.cleanup(true);

          bg.browser.contextualIdentities.remove.should.not.have.been.calledOnceWith(
            tab.cookieStoreId
          );
        });
      });
    });
  });
});
