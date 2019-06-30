describe('storage', () => {
  it('should initialize storage and version', async () => {
    const background = await loadBackground(false);
    expect(background.storage.local.preferences).to.deep.equal(
      background.storage.preferencesDefault
    );
    expect(background.storage.local.version).to.equal('0.1');
  });

  it('should add missing preferences', async () => {
    const background = await loadUninstalledBackground();
    browser.storage.local.get.resolves({
      ...background.storage.storageDefault,
      preferences: {
        ...background.storage.preferencesDefault
      },
      version: '0.1'
    });
    background.storage.preferencesDefault.newPreference = true;
    await background.initialize();
    expect(background.storage.local.preferences.newPreference).to.be.true;
  });
});