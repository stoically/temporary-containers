import { expect, loadBackground } from './setup';
describe('storage', () => {
  it('should initialize storage and version', async () => {
    const { background } = await loadBackground();
    expect(background.storage.local.preferences).to.deep.equal(
      background.preferences.defaults
    );
    expect(background.storage.local.version).to.equal('0.1');
  });

  it('should add missing preferences', async () => {
    const { background, browser } = await loadBackground({ initialize: false });
    browser.storage.local.get.resolves({
      ...background.storage.defaults,
      version: '0.1',
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (background.preferences.defaults as any).newPreference = true;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((background.storage.local.preferences as any).newPreference).to.be
      .undefined;
    await background.initialize();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((background.storage.local.preferences as any).newPreference).to.be
      .true;
  });
});
