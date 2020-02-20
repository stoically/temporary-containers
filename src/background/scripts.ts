import { TemporaryContainers } from './tmp';
import { Debug, PreferencesSchema } from '~/types';
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

  async maybeExecute(
    request: browser.webRequest.WebRequestOnBeforeRequestDetails
  ): Promise<void> {
    if (!Object.keys(this.pref.scripts.domain).length) {
      return;
    }

    for (const domainPattern in this.pref.scripts.domain) {
      if (!this.utils.matchDomainPattern(request.url, domainPattern)) {
        continue;
      }
      for (const script of this.pref.scripts.domain[domainPattern]) {
        try {
          this.debug('[maybeExecute] executing script', request);
          await browser.tabs.executeScript(request.tabId, script);
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
