preferencesTestSet.map(preferences => { describe(`preferences: ${JSON.stringify(preferences)}`, () => {

  describe('when triggering browseraction', () => {
    it('should open a new tab in a new temporary container', async () => {
      browser.tabs.create.resolves({
        id: 1
      });
      browser.contextualIdentities.create.resolves({
        cookieStoreId: 'firefox-container-1'
      });

      const background = await loadBackground(preferences);
      browser.browserAction.onClicked.addListener.yield();
      await nextTick();

      browser.contextualIdentities.create.should.have.been.calledWith({
        name: 'tmp1',
        color: 'red',
        icon: 'circle',
        number: 1,
        deletesHistory: false,
        clean: true
      });
      browser.tabs.create.should.have.been.calledWith({
        url: undefined,
        active: true,
        cookieStoreId: 'firefox-container-1'
      });
      browser.storage.local.set.should.have.been.calledWith(background.storage.local);
    });

    it('should open a new tab in a new temporary container with custom settings', async () => {
      browser.tabs.create.resolves({
        id: 1
      });
      browser.contextualIdentities.create.resolves({
        cookieStoreId: 'firefox-container-1'
      });

      const background = await loadBackground(preferences);
      background.storage.local.preferences.containerColorRandom = true;
      background.storage.local.preferences.containerIconRandom = true;
      background.storage.local.preferences.containerNumberMode = 'reuse';
      browser.browserAction.onClicked.addListener.yield();
      await nextTick();

      browser.contextualIdentities.create.should.have.been.calledWith({
        name: sinon.match.string,
        color: sinon.match.string,
        icon: sinon.match.string,
        number: 1,
        deletesHistory: false,
        clean: true
      });
      browser.tabs.create.should.have.been.calledWith({
        url: undefined,
        active: true,
        cookieStoreId: 'firefox-container-1'
      });
      browser.storage.local.set.should.have.been.calledWith(background.storage.local);
    });
  });
});});