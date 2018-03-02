describe('storage', () => {

  it('should initialize storage on installation', async () => {
    const background = reload('../src/background');
    await background.runtimeOnInstalled({
      reason: 'install'
    });
    background.storage.local.preferences.should.deep.equal(
      background.storage.preferencesDefault
    );
  });

  it('should not initialize on installation unless storage got written', async () => {
    const background = reload('../src/background');
    background.initialize();
    background.initialized.should.be.false;
    await nextTick();
    clock.tick(1000);
    await nextTick();
    clock.tick(1000);
    await nextTick();
    clock.tick(1000);
    await nextTick();
    background.initialized.should.be.false;
    await background.runtimeOnInstalled({
      reason: 'install'
    });
    await nextTick();
    clock.tick(1000);
    await nextTick();
    background.initialized.should.be.true;
  });

  it('should not initialize on startup unless storage got loaded', async () => {
    const background = reload('../src/background');
    background.initialize();
    background.initialized.should.be.false;
    await nextTick();
    clock.tick(1000);
    await nextTick();
    clock.tick(1000);
    await nextTick();
    clock.tick(1000);
    await nextTick();
    background.initialized.should.be.false;
    browser.storage.local.get.resolves({
      tempContainerCounter: 0,
      tempContainers: {},
      tabContainerMap: {},
      preferences: background.storage.preferencesDefault,
      statistics: {}
    });
    clock.tick(1000);
    await nextTick();
    background.initialized.should.be.true;
  });

  it('should not load storage if its already loading', async () => {
    const background = reload('../src/background');
    background.initialize();
    await nextTick();
    clock.tick(1000);
    const promise = background.storage.load();
    await nextTick();
    browser.storage.local.get.should.have.been.calledOnce;
    browser.storage.local.get.resolves({
      tempContainerCounter: 0,
      tempContainers: {},
      tabContainerMap: {},
      preferences: background.storage.preferencesDefault,
      statistics: {}
    });
    clock.tick(1000);
    await nextTick();
    clock.tick(1000);
    await nextTick();
    await promise;
  });

  it('should add missing preferences', async () => {
    const background = reload('../src/background');
    browser.storage.local.get.resolves({
      tempContainerCounter: 0,
      tempContainers: {},
      tabContainerMap: {},
      preferences: Object.assign({}, background.storage.preferencesDefault),
      statistics: {}
    });
    background.storage.preferencesDefault.newPreference = true;
    await background.initialize();
    background.storage.local.preferences.newPreference.should.be.true;
  });

});