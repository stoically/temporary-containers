import { debug } from './log';
import { addons } from './external-addons';

export class Management {
  public addons = addons;

  public async initialize() {
    try {
      const extensions = await browser.management.getAll();
      extensions.map(extension => {
        const addon = this.addons.get(extension.id);
        if (addon) {
          addon.enabled = extension.enabled;
          addon.version = extension.version;
        }
      });
    } catch (error) {
      debug('[management:initialize] couldnt getAll extensions', error);
      return;
    }
  }

  public disable(extension: browser.management.ExtensionInfo) {
    const addon = this.addons.get(extension.id);
    if (addon) {
      addon.enabled = false;
      addon.version = extension.version;
    }
  }

  public enable(extension: browser.management.ExtensionInfo) {
    const addon = this.addons.get(extension.id);
    if (addon) {
      addon.enabled = true;
      addon.version = extension.version;
    }
  }
}
