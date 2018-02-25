preferencesTestSet.map(preferences => { describe(`preferences: ${JSON.stringify(preferences)}`, () => {

  describe('Container Removal', () => {
    it('when the last tab in a container closes it should get removed eventually', async () => {
      await loadBackground(preferences);
      await helper.browser.openNewTmpTab({
        createsTabId: 2,
        createsContainer: 'firefox-tmp1'
      });
      await nextTick();

      browser.tabs.query.withArgs({}).resolves([{},{}]);
      browser.tabs.query.withArgs({cookieStoreId: 'firefox-tmp1'}).resolves([]);
      browser.contextualIdentities.remove.resolves({});

      const [promise] = browser.tabs.onRemoved.addListener.yield(2);
      await promise;
      clock.tick(15000);
      await nextTick();
      clock.tick(900000);
      await nextTick();
      clock.tick(5000);
      await nextTick();

      browser.contextualIdentities.remove.should.have.been.calledOnce;
    });
  });

});});