preferencesTestSet.map(preferences => {
  describe(`preferences: ${JSON.stringify(preferences)}`, () => {
    describe('Container Cleanup', () => {
      it('should remove the container after the given timeout', async () => {
        const background = await loadBackground(preferences);
        background.storage.local.preferences.container.removal = 150000;
        await helper.browser.openNewTmpTab({
          createsTabId: 2,
          createsContainer: 'firefox-tmp1',
        });

        browser.tabs.query.withArgs({}).resolves([{}, {}]);
        browser.tabs.query
          .withArgs({ cookieStoreId: 'firefox-tmp1' })
          .resolves([]);
        browser.contextualIdentities.remove.resolves({});

        const [promise] = browser.tabs.onRemoved.addListener.yield(2);
        await nextTick();
        clock.tick(2000);
        await promise;
        clock.tick(150000);
        await nextTick();
        clock.tick(5000);
        await nextTick();

        browser.contextualIdentities.remove.should.have.been.calledOnce;
      });

      describe('when no timeout is given', () => {
        it('should remove the container instantly', async () => {
          const background = await loadBackground(preferences);
          background.storage.local.preferences.container.removal = 0;
          await helper.browser.openNewTmpTab({
            createsTabId: 2,
            createsContainer: 'firefox-tmp1',
          });

          browser.tabs.query.withArgs({}).resolves([{}, {}]);
          browser.tabs.query
            .withArgs({ cookieStoreId: 'firefox-tmp1' })
            .resolves([]);
          browser.contextualIdentities.remove.resolves({});

          const [promise] = browser.tabs.onRemoved.addListener.yield(2);
          clock.tick(2000);
          await nextTick();
          await promise;

          browser.contextualIdentities.remove.should.have.been.calledOnce;
        });
      });
    });
  });
});
