import { TemporaryContainers } from '../background';
import { Container, CookieStoreId, IContainerOptions } from './container';
import { delay } from './lib';
import { debug } from './log';
import { IPreferences } from './preferences';
import { Storage } from './storage';

export interface IMacAssignment {
  userContextId: string;
  cookieStoreId: string;
  neverAsk: boolean;
}

interface IConfirmPage {
  tab: browser.tabs.Tab;
  targetURL: string;
  targetContainer: CookieStoreId;
  currentContainer: false | CookieStoreId;
}

interface IWaitingForConfirmPage {
  targetContainer: CookieStoreId;
  request: any;
  tab?: browser.tabs.Tab;
  deletesHistoryContainer: boolean;
}

export class MultiAccountContainers {
  public containerConfirmed: {
    [key: number]: CookieStoreId;
  } = {};

  private confirmPage: {
    [key: string]: IConfirmPage;
  } = {};
  private waitingForConfirmPage: {
    [key: string]: IWaitingForConfirmPage;
  } = {};

  private background: TemporaryContainers;
  private pref!: IPreferences;
  private storage!: Storage;
  private container!: Container;

  constructor(background: TemporaryContainers) {
    this.background = background;
  }

  public initialize() {
    this.pref = this.background.pref;
    this.storage = this.background.storage;
    this.container = this.background.container;
  }

  public isConfirmPage(url: string) {
    return url.match(/moz-extension:\/\/[^/]*\/confirm-page.html\?url=/);
  }

  public handleConfirmPage(tab: browser.tabs.Tab) {
    if (tab && tab.id && this.container.tabCreatedAsMacConfirmPage[tab.id]) {
      debug(
        '[handleConfirmPage] we reopened a confirmpage in that tab already',
        tab
      );
      return;
    }
    const multiAccountMatch = this.isConfirmPage(tab.url!);
    if (multiAccountMatch) {
      debug('[handleConfirmPage] is intervening', tab, multiAccountMatch);
      const parsedURL = new URL(tab.url!);
      const queryParams = parsedURL.search
        .split('&')
        .map(param => param.split('='));

      const confirmPage: IConfirmPage = {
        tab,
        targetURL: decodeURIComponent(queryParams[0][1]),
        targetContainer: queryParams[1][1],
        currentContainer: queryParams[2] ? queryParams[2][1] : false,
      };
      debug('[handleConfirmPage] parsed url', queryParams, confirmPage);
      if (this.waitingForConfirmPage[confirmPage.targetContainer]) {
        debug(
          '[handleConfirmPage] we are already waiting for this confirm page, maybe reopen',
          confirmPage.targetContainer
        );
        this._maybeReopenConfirmPage(
          this.waitingForConfirmPage[confirmPage.targetContainer],
          false,
          confirmPage
        );
      } else {
        debug(
          '[handleConfirmPage] we remember that we saw this confirm page, maybe it needs to be reopened',
          confirmPage.targetContainer
        );
        this.confirmPage[confirmPage.targetContainer] = confirmPage;
        delay(2000).then(() => {
          debug('[handleConfirmPage] cleaning up', confirmPage);
          delete this.confirmPage[confirmPage.targetContainer];
        });
      }
    }
  }

  public async maybeReopenConfirmPage(
    macAssignment: IMacAssignment,
    request: any,
    tab: browser.tabs.Tab | undefined,
    isolation = false
  ) {
    const deletesHistoryContainer =
      this.pref.deletesHistory.automaticMode === 'automatic';
    debug(
      '[maybeReopenConfirmPage]',
      macAssignment,
      request,
      tab,
      deletesHistoryContainer,
      this.container.tabCreatedAsMacConfirmPage
    );
    if (
      (tab && tab.id && this.container.tabCreatedAsMacConfirmPage[tab.id]) ||
      (request &&
        request.tabId &&
        this.container.tabCreatedAsMacConfirmPage[request.tabId])
    ) {
      debug(
        '[maybeReopenConfirmPage] we reopened a confirmpage in that tab / for that request.tabId already',
        tab,
        request
      );
      return;
    }
    const targetContainer = `${this.background.containerPrefix}-container-${macAssignment.userContextId}`;
    if (this.confirmPage[targetContainer]) {
      debug(
        '[maybeReopenConfirmPage] we saw a mac confirm page for the target container already',
        targetContainer,
        this.confirmPage[targetContainer]
      );
      if (tab && tab.cookieStoreId && tab.cookieStoreId === targetContainer) {
        debug(
          '[maybeReopenConfirmPage] tab is loading in target container, we do nothing'
        );
        return false;
      } else {
        return this._maybeReopenConfirmPage(
          {
            targetContainer,
            request,
            tab,
            deletesHistoryContainer,
          },
          isolation,
          false
        );
      }
    } else {
      debug(
        '[maybeReopenConfirmPage] we didnt saw a mac confirm page yet, waiting',
        targetContainer,
        tab
      );

      this.waitingForConfirmPage[targetContainer] = {
        targetContainer,
        request,
        tab,
        deletesHistoryContainer,
      };
      delay(2000).then(() => {
        debug('[maybeReopenConfirmPage] cleaning up', targetContainer);
        delete this.waitingForConfirmPage[targetContainer];
      });
      return false;
    }
  }

  public async _maybeReopenConfirmPage(
    {
      targetContainer,
      request,
      tab,
      deletesHistoryContainer,
    }: IWaitingForConfirmPage,
    isolation: boolean,
    confirmPage: false | IConfirmPage
  ) {
    debug(
      '[_maybeReopenConfirmPage]',
      targetContainer,
      request,
      tab,
      deletesHistoryContainer
    );
    if (this.waitingForConfirmPage[targetContainer]) {
      delete this.waitingForConfirmPage[targetContainer];
    }
    if (!confirmPage) {
      confirmPage = this.confirmPage[targetContainer];
    }
    if (!confirmPage) {
      debug('[_maybeReopenConfirmPage] something went wrong, aborting');
      return false;
    }
    const currentContainer = confirmPage.currentContainer;
    if (currentContainer) {
      if (!isolation && this.container.isPermanent(currentContainer)) {
        debug(
          '[_maybeReopenConfirmPage] currentContainer is permanent, we do nothing'
        );
        return false;
      } else if (
        this.storage.local.tempContainers[currentContainer] &&
        this.storage.local.tempContainers[currentContainer].clean
      ) {
        debug(
          '[_maybeReopenConfirmPage] the currentContainer mac confirm wants to open is a clean tmp container, we just cancel'
        );
        return { clean: true };
      } else {
        debug(
          '[_maybeReopenConfirmPage] currentContainer not clean, reopen in new tmp container'
        );
      }
    } else {
      debug(
        '[_maybeReopenConfirmPage] no currentContainer, reopen in new tmp container'
      );
    }

    await this.container.reloadTabInTempContainer({
      tab: confirmPage.tab,
      url: request.url,
      deletesHistory: deletesHistoryContainer,
      request,
      macConfirmPage: true,
    });
    return true;
  }

  public async getAssignment(url: string): Promise<IMacAssignment> {
    const assignment = await browser.runtime.sendMessage(
      '@testpilot-containers',
      {
        method: 'getAssignment',
        url,
      }
    );

    if (!assignment) {
      return assignment;
    }

    return {
      userContextId: assignment.userContextId,
      cookieStoreId: `${this.background.containerPrefix}-container-${assignment.userContextId}`,
      neverAsk: assignment.neverAsk,
    };
  }
}
