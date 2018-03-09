preferencesTestSet.map(preferences => { describe(`preferences: ${JSON.stringify(preferences)}`, () => {

  describe('Container Removal', () => {
    it('when the last tab in a container closes it should get removed eventually (15minutes)', async () => {
      const background = await loadBackground(preferences);
      background.storage.local.preferences.containerRemoval = '15minutes';
      await helper.browser.openNewTmpTab({
        createsTabId: 2,
        createsContainer: 'firefox-tmp1'
      });

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

    it('when the last tab in a container closes it should get removed eventually (5minutes)', async () => {
      const background = await loadBackground(preferences);
      background.storage.local.preferences.containerRemoval = '5minutes';
      await helper.browser.openNewTmpTab({
        createsTabId: 2,
        createsContainer: 'firefox-tmp1'
      });

      browser.tabs.query.withArgs({}).resolves([{},{}]);
      browser.tabs.query.withArgs({cookieStoreId: 'firefox-tmp1'}).resolves([]);
      browser.contextualIdentities.remove.resolves({});

      const [promise] = browser.tabs.onRemoved.addListener.yield(2);
      await promise;
      clock.tick(15000);
      await nextTick();
      clock.tick(300000);
      await nextTick();
      clock.tick(5000);
      await nextTick();

      browser.contextualIdentities.remove.should.have.been.calledOnce;
    });

    it('when the last tab in a container closes it should get removed eventually (2minutes)', async () => {
      const background = await loadBackground(preferences);
      background.storage.local.preferences.containerRemoval = '2minutes';
      await helper.browser.openNewTmpTab({
        createsTabId: 2,
        createsContainer: 'firefox-tmp1'
      });

      browser.tabs.query.withArgs({}).resolves([{},{}]);
      browser.tabs.query.withArgs({cookieStoreId: 'firefox-tmp1'}).resolves([]);
      browser.contextualIdentities.remove.resolves({});

      const [promise] = browser.tabs.onRemoved.addListener.yield(2);
      await promise;
      clock.tick(15000);
      await nextTick();
      clock.tick(150000);
      await nextTick();
      clock.tick(5000);
      await nextTick();

      browser.contextualIdentities.remove.should.have.been.calledOnce;
    });

    it('when the last tab in a container closes it should get removed eventually (instant)', async () => {
      const background = await loadBackground(preferences);
      background.storage.local.preferences.containerRemoval = 'instant';
      await helper.browser.openNewTmpTab({
        createsTabId: 2,
        createsContainer: 'firefox-tmp1'
      });

      browser.tabs.query.withArgs({}).resolves([{},{}]);
      browser.tabs.query.withArgs({cookieStoreId: 'firefox-tmp1'}).resolves([]);
      browser.contextualIdentities.remove.resolves({});

      const [promise] = browser.tabs.onRemoved.addListener.yield(2);
      await promise;
      clock.tick(15000);
      await nextTick();

      browser.contextualIdentities.remove.should.have.been.calledOnce;
    });
  });
});});