const delay = require('delay');
const { debug } = require('./log');

class MultiAccountContainers {
  constructor() {
    this.confirmPage = {};
    this.waitingForConfirmPage = {};
  }

  initialize(background) {
    this.storage = background.storage;
    this.container = background.container;
    background.on('handleMultiAccountContainersConfirmPage', this.handleConfirmPage.bind(this));
  }

  handleConfirmPage(tab) {
    const multiAccountMatch = tab.url.match(/moz-extension:\/\/[^/]*\/confirm-page.html\?url=/);
    if (multiAccountMatch) {
      debug('[handleConfirmPage] is intervening', tab, multiAccountMatch);
      const parsedURL = new URL(tab.url);
      const queryParams = parsedURL.search.split('&').map(param => param.split('='));
      const confirmPage = {
        tab,
        targetURL: decodeURIComponent(queryParams[0][1]),
        targetContainer: queryParams[1][1],
        currentContainer: queryParams[2] ? queryParams[2][1] : false
      };
      debug('[handleConfirmPage] parsed url', parsedURL, queryParams, confirmPage);
      if (this.waitingForConfirmPage[confirmPage.targetContainer]) {
        debug('[handleConfirmPage] we are already waiting for this confirm page, maybe reopen', confirmPage.targetContainer);
        this._maybeReopenConfirmPage(this.waitingForConfirmPage[confirmPage.targetContainer]);
      } else {
        debug('[handleConfirmPage] we remember that we saw this confirm page, maybe it needs to be reopened', confirmPage.targetContainer);
        this.confirmPage[confirmPage.targetContainer] = confirmPage;
        delay(2000).then(() => {
          debug('[handleConfirmPage] cleaning up', confirmPage);
          delete this.confirmPage[confirmPage.targetContainer];
        });
      }
    }
  }

  maybeReopenConfirmPage(macAssignment, request, tab, deletesHistoryContainer) {
    debug('[maybeReopenConfirmPage]', macAssignment, request, tab, deletesHistoryContainer);
    const targetContainer = `firefox-container-${macAssignment.userContextId}`;
    if (this.confirmPage[targetContainer]) {
      debug('[maybeReopenConfirmPage] we saw a mac confirm page for the target container already', targetContainer);
      this._maybeReopenConfirmPage({targetContainer, request, tab, deletesHistoryContainer});
    } else {
      debug('[maybeReopenConfirmPage] we didnt saw a mac confirm page yet, waiting', targetContainer);
      this.waitingForConfirmPage[targetContainer] = {targetContainer, request, tab, deletesHistoryContainer};
      delay(2000).then(() => {
        debug('[maybeReopenConfirmPage] cleaning up', targetContainer);
        delete this.waitingForConfirmPage[targetContainer];
      });
    }
  }

  _maybeReopenConfirmPage({targetContainer, request, tab, deletesHistoryContainer}) {
    debug('[_maybeReopenConfirmPage]', targetContainer, request, tab, deletesHistoryContainer);
    if (this.waitingForConfirmPage[targetContainer]) {
      delete this.waitingForConfirmPage[targetContainer];
    }
    const currentContainer = this.confirmPage[targetContainer].currentContainer;
    if (currentContainer) {
      if (this.storage.local.tempContainers[currentContainer].clean) {
        debug('[_maybeReopenConfirmPage] the currentContainer mac confirm wants to open is a clean tmp container, we do nothing');
        return;
      } else {
        debug('[_maybeReopenConfirmPage] currentContainer not clean, reopen in new tmp container');
      }
    } else {
      debug('[_maybeReopenConfirmPage] no currentContainer, reopen in new tmp container');
    }

    this.container.reloadTabInTempContainer(
      this.confirmPage[targetContainer].tab,
      request.url,
      this.confirmPage[targetContainer].tab.active,
      deletesHistoryContainer,
      request
    );
  }

  getAssignment(url) {
    return browser.runtime.sendMessage('@testpilot-containers', {
      method: 'getAssignment',
      url
    });
  }
}

module.exports = MultiAccountContainers;