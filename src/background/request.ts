import { TemporaryContainers } from '../background';
import { BrowserAction } from './browseraction';
import { Container } from './container';
import { History } from './history';
import { Isolation } from './isolation';
import { delay } from './lib';
import { debug } from './log';
import { MultiAccountContainers } from './mac';
import { Management } from './management';
import { MouseClick } from './mouseclick';
import { PreferencesSchema } from './preferences';

export class Request {
  public lastSeenRequestUrl: {
    [key: number]: string;
  } = {};

  private canceledTabs: {
    [key: number]: {
      requestIds: {
        [key: number]: true;
      };
      urls: {
        [key: string]: true;
      };
    };
  } = {};
  private canceledRequests: {
    [key: string]: boolean;
  } = {};
  private requestIdUrlSeen: {
    [key: string]: boolean;
  } = {};
  private cleanRequests: {
    [key: string]: boolean;
  } = {};

  private background: TemporaryContainers;
  private pref!: PreferencesSchema;
  private container!: Container;
  private mouseclick!: MouseClick;
  private browseraction!: BrowserAction;
  private mac!: MultiAccountContainers;
  private isolation!: Isolation;
  private management!: Management;
  private history!: History;

  constructor(background: TemporaryContainers) {
    this.background = background;
  }

  public async initialize() {
    this.pref = this.background.pref;
    this.container = this.background.container;
    this.mouseclick = this.background.mouseclick;
    this.browseraction = this.background.browseraction;
    this.mac = this.background.mac;
    this.isolation = this.background.isolation;
    this.management = this.background.management;
    this.history = this.background.history;
  }

  public async webRequestOnBeforeRequest(request: any) {
    debug('[webRequestOnBeforeRequest] incoming request', request);
    const requestIdUrl = `${request.requestId}+${request.url}`;
    if (requestIdUrl in this.requestIdUrlSeen) {
      return;
    } else {
      this.requestIdUrlSeen[requestIdUrl] = true;
      delay(300000).then(() => {
        delete this.requestIdUrlSeen[requestIdUrl];
      });
    }

    this.mouseclick.beforeHandleRequest(request);

    let returnVal:
      | false
      | {
          clean?: boolean;
          cancel?: boolean;
        }
      | undefined = false;
    try {
      returnVal = await this.handleRequest(request);
    } catch (error) {
      debug(
        '[webRequestOnBeforeRequest] handling request failed',
        error.toString()
      );
    }

    this.mouseclick.afterHandleRequest(request);

    if (!this.lastSeenRequestUrl[request.requestId]) {
      delay(300000).then(() => {
        delete this.lastSeenRequestUrl[request.requestId];
      });
    }
    this.lastSeenRequestUrl[request.requestId] = request.url;

    if (returnVal && returnVal.cancel) {
      this.cancelRequest(request);
      return returnVal;
    } else if (!returnVal || (returnVal && !returnVal.clean)) {
      this.container.markUnclean(request.tabId);
    }

    // make sure we shouldnt cancel anyway
    if (this.shouldCancelRequest(request)) {
      debug('[webRequestOnBeforeRequest] canceling', request);
      this.cancelRequest(request);
      return { cancel: true };
    }
    return;
  }

  public async handleRequest(request: any) {
    if (request.tabId === -1) {
      debug(
        '[handleRequest] onBeforeRequest request doesnt belong to a tab, why are you main_frame?',
        request
      );
      return false;
    }

    this.browseraction.removeBadge(request.tabId);

    if (this.shouldCancelRequest(request)) {
      debug('[handleRequest] canceling', request);
      return { cancel: true };
    }

    if (this.container.noContainerTabs[request.tabId]) {
      debug('[handleRequest] no container tab, we ignore that', request);
      return false;
    }

    let tab;
    let openerTab;
    try {
      tab = await browser.tabs.get(request.tabId);
      if (tab && tab.openerTabId) {
        openerTab = await browser.tabs.get(tab.openerTabId);
      }
      debug(
        '[handleRequest] onbeforeRequest requested tab information',
        tab,
        openerTab
      );
    } catch (error) {
      debug(
        '[handleRequest] onbeforeRequest retrieving tab information failed, mac was probably faster',
        error
      );
    }

    let macAssignment;
    if (this.management.addons.get('@testpilot-containers')?.enabled) {
      try {
        macAssignment = await this.mac.getAssignment(request.url);
      } catch (error) {
        debug(
          '[handleRequest] contacting mac failed, probably old version',
          error
        );
      }
    }
    if (macAssignment) {
      if (macAssignment.neverAsk) {
        debug('[handleRequest] mac neverask assigned', macAssignment);
        return false;
      } else {
        debug('[handleRequest] mac assigned', macAssignment);
      }
    }

    if (await this.externalAddonHasPrecedence({ request, tab, openerTab })) {
      return false;
    }

    this.history.maybeAddHistory(tab, request.url);

    if (
      this.pref.ignoreRequests.length &&
      this.pref.ignoreRequests.find(ignorePattern => {
        return this.isolation.matchDomainPattern(request.url, ignorePattern);
      })
    ) {
      debug(
        '[handleRequest] request url is on the ignoreRequests list',
        request
      );
      return false;
    }

    if (tab && this.container.isClean(tab.cookieStoreId!)) {
      // removing this clean check can result in endless loops
      debug(
        '[handleRequest] not isolating because the tmp container is still clean'
      );
      if (!this.cleanRequests[request.requestId]) {
        this.cleanRequests[request.requestId] = true;
        delay(300000).then(() => {
          delete this.cleanRequests[request.requestId];
        });
      }
      return false;
    }

    if (this.cleanRequests[request.requestId]) {
      debug(
        '[handleRequest] not isolating because of clean redirect requests',
        request
      );
      return false;
    }

    const isolated = await this.isolation.maybeIsolate({
      tab,
      request,
      openerTab,
      macAssignment,
    });
    if (isolated) {
      debug(
        '[handleRequest] we decided to isolate and open new tmpcontainer',
        request
      );
      return isolated;
    }

    if (!this.pref.automaticMode.active || !tab) {
      return false;
    }

    if (
      tab &&
      tab.cookieStoreId === `${this.background.containerPrefix}-default` &&
      openerTab
    ) {
      debug('[handleRequest] default container and openerTab', openerTab);
      if (
        !openerTab.url!.startsWith('about:') &&
        !openerTab.url!.startsWith('moz-extension:')
      ) {
        debug(
          '[handleRequest] request didnt came from about/moz-extension page',
          openerTab
        );
        return false;
      }
    }

    if (
      tab &&
      tab.cookieStoreId !== `${this.background.containerPrefix}-default`
    ) {
      debug(
        '[handleRequest] onBeforeRequest tab belongs to a non-default container',
        tab,
        request
      );
      return false;
    }

    if (macAssignment) {
      debug(
        '[handleRequest] decided to reopen but mac assigned, maybe reopen confirmpage',
        request,
        tab,
        macAssignment
      );
      return this.mac.maybeReopenConfirmPage(macAssignment, request, tab);
    }

    debug('[handleRequest] decided to reload in temp tab', tab, request);
    if (this.cancelRequest(request)) {
      return { cancel: true };
    }

    debug('[handleRequest] reload in temp tab', tab, request);
    await this.container.reloadTabInTempContainer({
      tab,
      url: request.url,
      deletesHistory: this.pref.deletesHistory.automaticMode === 'automatic',
      request,
      dontPin: false,
    });

    return { cancel: true };
  }

  public cancelRequest(request: any) {
    if (
      !request ||
      typeof request.requestId === 'undefined' ||
      typeof request.tabId === 'undefined'
    ) {
      debug('[cancelRequest] invalid request', request);
      return;
    }

    if (!this.canceledRequests[request.requestId]) {
      this.canceledRequests[request.requestId] = true;
      // requestIds are unique per session, so we have no pressure to remove them
      setTimeout(() => {
        debug(
          '[webRequestOnBeforeRequest] cleaning up canceledRequests',
          request
        );
        delete this.canceledRequests[request.requestId];
      }, 300000);
    }

    if (!this.canceledTabs[request.tabId]) {
      debug('[cancelRequest] marked request as canceled', request);
      // workaround until https://bugzilla.mozilla.org/show_bug.cgi?id=1437748 is resolved
      this.canceledTabs[request.tabId] = {
        requestIds: {
          [request.requestId]: true,
        },
        urls: {
          [request.url]: true,
        },
      };
      // cleanup canceledTabs later
      setTimeout(() => {
        debug('[webRequestOnBeforeRequest] cleaning up canceledTabs', request);
        delete this.canceledTabs[request.tabId];
      }, 2000);
      return false;
    } else {
      debug('[cancelRequest] already canceled', request, this.canceledTabs);
      let cancel = false;
      if (this.shouldCancelRequest(request)) {
        // same requestId or url from the same tab, this is a redirect that we have to cancel to prevent opening two tabs
        cancel = true;
        debug('[cancelRequest] probably redirect, aborting', request);
      }
      // we decided to cancel the request at this point, register canceled request
      this.canceledTabs[request.tabId].requestIds[request.requestId] = true;
      this.canceledTabs[request.tabId].urls[request.url] = true;
      return cancel;
    }
  }

  public shouldCancelRequest(request: any) {
    if (
      !request ||
      typeof request.requestId === 'undefined' ||
      typeof request.tabId === 'undefined'
    ) {
      debug('[shouldCancelRequest] invalid request', request);
      return;
    }

    if (
      this.canceledRequests[request.requestId] ||
      (this.canceledTabs[request.tabId] &&
        (this.canceledTabs[request.tabId].requestIds[request.requestId] ||
          this.canceledTabs[request.tabId].urls[request.url]))
    ) {
      return true;
    }
    return false;
  }

  public cleanupCanceled(request: any) {
    if (this.canceledTabs[request.tabId]) {
      delete this.canceledTabs[request.tabId];
    }
  }

  public async externalAddonHasPrecedence({
    request,
    tab,
    openerTab,
  }: {
    request: any;
    tab?: browser.tabs.Tab;
    openerTab?: browser.tabs.Tab;
  }) {
    const parsedUrl = new URL(request.url);

    if (this.management.addons.get('containerise@kinte.sh')?.enabled) {
      try {
        const hostmap = await browser.runtime.sendMessage(
          'containerise@kinte.sh',
          {
            method: 'getHostMap',
            url: request.url,
          }
        );
        if (
          typeof hostmap === 'object' &&
          hostmap.cookieStoreId &&
          hostmap.enabled
        ) {
          debug(
            '[handleRequest] assigned with containerise we do nothing',
            hostmap
          );
          return true;
        } else {
          debug('[handleRequest] not assigned with containerise', hostmap);
        }
      } catch (error) {
        debug(
          '[handleRequest] contacting containerise failed, probably old version',
          error
        );
      }
    }

    if (
      this.management.addons.get('block_outside_container@jspengun.org')
        ?.enabled
    ) {
      try {
        const response = await browser.runtime.sendMessage(
          'block_outside_container@jspenguin.org',
          {
            action: 'rule_exists',
            domain: parsedUrl.hostname,
          }
        );
        if (response.rule_exists) {
          debug(
            '[handleRequest] assigned with block_outside_container we do nothing'
          );
          return true;
        } else {
          debug('[handleRequest] not assigned with block_outside_container');
        }
      } catch (error) {
        debug(
          '[handleRequest] contacting block_outside_container failed',
          error
        );
      }
    }

    const parsedTabUrl = tab && /^https?:/.test(tab.url!) && new URL(tab.url!);
    const parsedOpenerTabUrl =
      openerTab && /^https?:/.test(openerTab.url!) && new URL(openerTab.url!);
    for (const containWhat of [
      '@contain-facebook',
      '@contain-google',
      '@contain-twitter',
      '@contain-youtube',
      '@contain-amazon',
    ]) {
      const addon = this.management.addons.get(containWhat);
      if (!addon || !addon.enabled || !addon.REs) {
        continue;
      }
      for (const RE of addon.REs) {
        if (
          RE.test(parsedUrl.hostname) ||
          (parsedTabUrl && RE.test(parsedTabUrl.hostname)) ||
          (parsedOpenerTabUrl && RE.test(parsedOpenerTabUrl.hostname))
        ) {
          debug(
            '[handleRequest] handled by active container addon, ignoring',
            containWhat,
            RE,
            request.url
          );
          return true;
        }
      }
    }
  }
}
