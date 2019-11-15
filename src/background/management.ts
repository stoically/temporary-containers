import { addons } from './external-addons';
import { TemporaryContainers } from './tmp';
import { Debug } from '~/types';

export class Management {
  public addons = addons;
  private debug: Debug;

  constructor(background: TemporaryContainers) {
    this.debug = background.debug;
  }

  public async initialize(): Promise<void> {
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
      this.debug('[management:initialize] couldnt getAll extensions', error);
      return;
    }
  }

  public disable(extension: browser.management.ExtensionInfo): void {
    const addon = this.addons.get(extension.id);
    if (addon) {
      addon.enabled = false;
      addon.version = extension.version;
    }
  }

  public enable(extension: browser.management.ExtensionInfo): void {
    const addon = this.addons.get(extension.id);
    if (addon && extension.enabled) {
      addon.enabled = true;
      addon.version = extension.version;
    }
  }
}
