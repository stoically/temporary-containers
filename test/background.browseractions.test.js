describe('when triggering browseraction', () => {
  it('should open a new tab in a new temporary container', (done) => {
    browser.tabs.create.resolves({
      id: 1
    });
    browser.contextualIdentities.create.resolves({
      cookieStoreId: 'firefox-container-1'
    });
    (async () => {
      const background = await loadBackground();
      browser.browserAction.onClicked.addListener.yield();

      process.nextTick(() => {
        browser.contextualIdentities.create.should.have.been.calledWith({
          name: 'tmp1',
          color: 'red',
          icon: 'circle',
          number: 1
        });
        browser.tabs.create.should.have.been.calledWith({
          url: undefined,
          active: true,
          cookieStoreId: 'firefox-container-1'
        });
        browser.storage.sync.set.should.have.been.calledWith(background.storage.local);
        done();
      });
    })();
  });

  it('should open a new tab in a new temporary container with custom settings', (done) => {
    browser.tabs.create.resolves({
      id: 1
    });
    browser.contextualIdentities.create.resolves({
      cookieStoreId: 'firefox-container-1'
    });
    (async () => {
      const background = await loadBackground();
      background.storage.local.preferences.containerColorRandom = true;
      background.storage.local.preferences.containerIconRandom = true;
      background.storage.local.preferences.containerNumberMode = 'reuse';
      browser.browserAction.onClicked.addListener.yield();

      process.nextTick(() => {
        browser.contextualIdentities.create.should.have.been.calledWith({
          name: sinon.match.string,
          color: sinon.match.string,
          icon: sinon.match.string,
          number: 1
        });
        browser.tabs.create.should.have.been.calledWith({
          url: undefined,
          active: true,
          cookieStoreId: 'firefox-container-1'
        });
        browser.storage.sync.set.should.have.been.calledWith(background.storage.local);
        done();
      });
    })();
  });
});
