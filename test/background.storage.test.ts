describe('storage', () => {
  it('should initialize storage and version', async () => {
    const background = await loadBackground(false);
    expect(background.storage.local.preferences).to.deep.equal(
      background.preferences.defaults
    );
    expect(background.storage.local.version).to.equal('0.1');
  });

  it('should add missing preferences', async () => {
    const background = await loadUninstalledBackground();
    browser.storage.local.get.resolves({
      ...background.storage.defaults,
      preferences: {
        ...background.preferences.defaults,
      },
      version: '0.1',
    });
    background.preferences.defaults.newPreference = true;
    await background.initialize();
    expect(background.storage.local.preferences.newPreference).to.be.true;
  });
});
