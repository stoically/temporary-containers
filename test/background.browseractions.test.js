preferencesTestSet.map(preferences => { describe(`preferences: ${JSON.stringify(preferences)}`, () => {

  describe('when triggering browseraction', () => {
    it('should open a new tab in a new temporary container', async () => {
      const background = await loadBareBackground(preferences);
      browser.tabs.create.resolves({
        id: 1
      });
      browser.contextualIdentities.create.resolves({
        cookieStoreId: 'firefox-container-1'
      });

      await background.initialize();
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
        cookieStoreId: 'firefox-container-1'
      });
      browser.storage.local.set.should.have.been.calledWith(background.storage.local);
    });

    it('should open a new tab in a new temporary container with custom settings', async () => {
      const background = await loadBareBackground(preferences);
      browser.tabs.create.resolves({
        id: 1
      });
      browser.contextualIdentities.create.resolves({
        cookieStoreId: 'firefox-container-1'
      });

      await background.initialize();
      background.storage.local.preferences.containerColorRandom = true;
      background.storage.local.preferences.containerIconRandom = true;
      background.storage.local.preferences.containerNumberMode = 'reuse';
      browser.browserAction.onClicked.addListener.yield();
      await nextTick();

      expect(browser.contextualIdentities.create).to.have.been.calledWith({
        name: sinon.match.string,
        color: sinon.match.string,
        icon: sinon.match.string,
        number: 1,
        deletesHistory: false,
        clean: true
      });
      expect(browser.tabs.create).to.have.been.calledWith(sinon.match({
        url: undefined,
        cookieStoreId: 'firefox-container-1'
      }));
      expect(browser.storage.local.set).to.have.been.calledWith(background.storage.local);
    });
  });
});});