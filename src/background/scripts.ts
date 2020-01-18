import { TemporaryContainers } from './tmp';
import { Debug, PreferencesSchema, Tab } from '~/types';
import { Utils } from './utils';

export class Scripts {
  private background: TemporaryContainers;
  private debug: Debug;
  private pref!: PreferencesSchema;
  private utils!: Utils;

  constructor(background: TemporaryContainers) {
    this.background = background;
    this.debug = background.debug;
  }

  initialize(): void {
    this.pref = this.background.pref;
    this.utils = this.background.utils;
  }

  async maybeExecute(tab: Tab): Promise<void> {
    if (!Object.keys(this.pref.scripts.domain).length) {
      return;
    }

    for (const domainPattern in this.pref.scripts.domain) {
      if (!this.utils.matchDomainPattern(tab.url, domainPattern)) {
        continue;
      }
      for (const script of this.pref.scripts.domain[domainPattern]) {
        try {
          await browser.tabs.executeScript(tab.id, script);
        } catch (error) {
          this.debug(
            '[maybeExecute] executing script failed',
            error.toString()
          );
        }
      }
    }
  }
}
