import { TemporaryContainers } from './tmp';
import { Container } from './container';
import { MultiAccountContainers } from './mac';
import { Management } from './management';
import { MouseClick } from './mouseclick';
import { Request } from './request';
import { Utils } from './utils';
import {
  PreferencesSchema,
  IsolationAction,
  Tab,
  MacAssignment,
  Debug,
} from '~/types';

export class Isolation {
  private background: TemporaryContainers;
  private debug: Debug;
  private pref!: PreferencesSchema;
  private container!: Container;
  private request!: Request;
  private mouseclick!: MouseClick;
  private mac!: MultiAccountContainers;
  private management!: Management;
  private utils!: Utils;
  private intervalIsolationTarget: number;
  private intervalIsolationInterval: number;

  constructor(background: TemporaryContainers) {
    this.background = background;
    this.debug = background.debug;
    this.intervalIsolationTarget = 0;
    this.intervalIsolationInterval = 0;
  }

  initialize(): void {
    this.pref = this.background.pref;
    this.container = this.background.container;
    this.request = this.background.request;
    this.mouseclick = this.background.mouseclick;
    this.mac = this.background.mac;
    this.management = this.background.management;
    this.utils = this.background.utils;
  }

  async maybeIsolate({
    tab,
    request,
    openerTab,
    macAssignment,
  }: {
    tab?: Tab;
    request: browser.webRequest.WebRequestOnBeforeRequestDetails;
    openerTab?: Tab;
    macAssignment?: MacAssignment;
  }): Promise<boolean | { cancel: true }> {
    if (!this.pref.isolation.active) {
      this.debug('[maybeIsolate] isolation is disabled');
      return false;
    }
    if (
      tab &&
      request &&
      request.originUrl &&
      this.mac.isConfirmPage(request.originUrl)
    ) {
      this.debug('[maybeIsolate] we are coming from a mac confirm page');
      this.mac.containerConfirmed[tab.id] = tab.cookieStoreId;
      return false;
    }

    if (
      this.mouseclick.isolated[request.url] &&
      tab &&
      tab.cookieStoreId !== `${this.background.containerPrefix}-default` &&
      this.container.urlCreatedContainer[request.url] === tab.cookieStoreId
    ) {
      this.debug(
        '[maybeIsolate] link click already created this container, we can stop here',
        request,
        tab
      );
      return false;
    }

    if (
      !(await this.shouldIsolate({ tab, request, openerTab, macAssignment }))
    ) {
      this.debug('[maybeIsolate] decided to not isolate', tab, request);
      return false;
    }
    this.debug('[maybeIsolate] decided to isolate', tab, request);

    const excludedDomainPatterns = Object.keys(
      this.pref.isolation.global.excluded
    );
    if (excludedDomainPatterns.length) {
      const excluded = excludedDomainPatterns.find((excludedDomainPattern) => {
        return this.utils.matchDomainPattern(
          request.url,
          excludedDomainPattern
        );
      });
      if (excluded) {
        this.debug(
          '[maybeIsolate] request url matches global excluded domain pattern',
          request,
          excludedDomainPatterns
        );
        return false;
      }
    }

    if (
      tab &&
      this.container.isPermanent(tab.cookieStoreId) &&
      this.pref.isolation.global.excludedContainers[tab.cookieStoreId]
    ) {
      this.debug(
        '[maybeIsolate] container on global excluded containers list',
        tab
      );
      return false;
    }

    if (
      macAssignment &&
      tab &&
      this.mac.containerConfirmed[tab.id] &&
      tab.cookieStoreId === this.mac.containerConfirmed[tab.id]
    ) {
      this.debug(
        '[maybeIsolate] mac confirmed container, not isolating',
        this.mac.containerConfirmed,
        macAssignment
      );
      return false;
    }

    this.debug('[maybeIsolate] isolating', tab, request);
    if (this.request.cancelRequest(request)) {
      this.debug('[maybeIsolate] canceling request');
      return { cancel: true };
    }

    if (
      macAssignment &&
      (!tab || (tab && tab.cookieStoreId !== macAssignment.cookieStoreId))
    ) {
      this.debug(
        '[maybeIsolate] decided to reopen but mac assigned, maybe reopen confirmpage',
        request,
        tab,
        macAssignment
      );
      this.mac.maybeReopenConfirmPage(macAssignment, request, tab, true);
      return false;
    }

    const params = {
      tab,
      url: request.url,
      request,
      deletesHistory:
        this.pref.deletesHistory.containerIsolation === 'automatic',
    };

    let reload = false;
    if (this.mouseclick.isolated[request.url]) {
      const clickType = this.mouseclick.isolated[request.url].clickType;
      if (
        this.pref.isolation.global.mouseClick[clickType].container ===
        'deleteshistory'
      ) {
        params.deletesHistory = true;
      }

      if (
        tab &&
        clickType === 'left' &&
        this.mouseclick.isolated[request.url].tab.id !== tab.id
      ) {
        reload = true;
      }
    }

    if (
      tab &&
      (reload ||
        tab.url === 'about:home' ||
        tab.url === 'about:newtab' ||
        tab.url === 'about:blank' ||
        this.pref.replaceTabs)
    ) {
      await this.container.reloadTabInTempContainer(params);
    } else {
      await this.container.createTabInTempContainer(params);
    }
    return { cancel: true };
  }

  async shouldIsolate({
    tab,
    request,
    openerTab,
    macAssignment,
  }: {
    tab?: Tab;
    request: browser.webRequest.WebRequestOnBeforeRequestDetails;
    openerTab?: Tab;
    macAssignment?: MacAssignment;
  }): Promise<boolean> {
    this.debug('[shouldIsolate]', tab, request);

    // special-case TST group tabs #264
    if (
      openerTab &&
      this.management.addons.get('treestyletab@piro.sakura.ne.jp')?.enabled
    ) {
      try {
        const treeItem = await browser.runtime.sendMessage(
          'treestyletab@piro.sakura.ne.jp',
          {
            tab: openerTab.id,
            type: 'get-tree',
          }
        );
        if (treeItem && treeItem.states.includes('group-tab')) {
          this.debug(
            '[shouldIsolate] not isolating because originated from TST group tag',
            openerTab,
            tab,
            request
          );
          return false;
        }
      } catch (error) {
        this.debug('[shouldIsolate] failed contacting TST', error.toString());
      }
    }

    return (
      this.shouldIsolateMouseClick({ request, tab, openerTab }) ||
      this.shouldIsolateMac({ tab, macAssignment }) ||
      (await this.shouldIsolateNavigation({ request, tab, openerTab })) ||
      (await this.shouldIsolateAlways({ request, tab, openerTab }))
    );
  }

  shouldIsolateMouseClick({
    request,
    tab,
    openerTab,
  }: {
    tab?: Tab;
    request: browser.webRequest.WebRequestOnBeforeRequestDetails;
    openerTab?: Tab;
  }): boolean {
    if (!this.mouseclick.isolated[request.url]) {
      return false;
    }

    if (
      tab &&
      ![tab.id, tab.openerTabId].includes(
        this.mouseclick.isolated[request.url].tab.id
      )
    ) {
      this.debug(
        '[shouldIsolateMouseClick] not isolating mouse click because tab/openerTab id is different',
        request,
        tab,
        openerTab,
        this.mouseclick.isolated[request.url].tab
      );
      return false;
    }

    this.debug(
      '[beforeHandleRequest] decreasing isolated mouseclick count',
      this.mouseclick.isolated[request.url]
    );
    this.mouseclick.isolated[request.url].count--;

    if (this.mouseclick.isolated[request.url].count < 0) {
      this.debug(
        '[shouldIsolateMouseClick] not isolating and removing isolated mouseclick because its count is < 0',
        this.mouseclick.isolated[request.url]
      );
      this.mouseclick.isolated[request.url].abortController.abort();
      delete this.mouseclick.isolated[request.url];
      return false;
    }

    if (!this.mouseclick.isolated[request.url].count) {
      this.debug(
        '[shouldIsolateMouseClick] removing isolated mouseclick because its count is 0',
        this.mouseclick.isolated[request.url]
      );
      this.mouseclick.isolated[request.url].abortController.abort();
      delete this.mouseclick.isolated[request.url];
    }

    this.debug(
      '[shouldIsolateMouseClick] decided to isolate mouseclick',
      this.mouseclick.isolated[request.url]
    );
    return true;
  }

  async shouldIsolateNavigation({
    request,
    tab,
    openerTab,
  }: {
    tab?: Tab;
    request: browser.webRequest.WebRequestOnBeforeRequestDetails;
    openerTab?: Tab;
  }): Promise<boolean> {
    if (!tab || !tab.url) {
      this.debug(
        '[shouldIsolateNavigation] we cant proceed without tab url information',
        tab,
        request
      );
      return false;
    }

    if (
      (tab.url === 'about:blank' ||
        tab.url === 'about:newtab' ||
        tab.url === 'about:home') &&
      !openerTab
    ) {
      this.debug(
        '[shouldIsolateNavigation] not isolating because the tab url is blank/newtab/home and no openerTab'
      );
      return false;
    }

    if (
      openerTab &&
      tab.url === 'about:blank' &&
      this.container.isPermanent(tab.cookieStoreId) &&
      openerTab.cookieStoreId !== tab.cookieStoreId
    ) {
      this.debug(
        '[shouldIsolateNavigation] the tab loads a permanent container that is different from the openerTab, probaby explicitly selected in the context menu'
      );
      return false;
    }

    const url =
      this.request.lastSeenRequestUrl[request.requestId] &&
      this.request.lastSeenRequestUrl[request.requestId] !== tab.url
        ? this.request.lastSeenRequestUrl[request.requestId]
        : (tab.url === 'about:blank' &&
            openerTab &&
            openerTab.url.startsWith('http') &&
            openerTab.url) ||
          tab.url;
    const parsedURL =
      url.startsWith('about:') || url.startsWith('moz-extension:')
        ? url
        : new URL(url).hostname;
    const parsedRequestURL = new URL(request.url);

    for (const patternPreferences of this.pref.isolation.domain) {
      const domainPattern = patternPreferences.pattern;

      if (
        !this.utils.matchDomainPattern(
          (tab.url === 'about:blank' &&
            openerTab &&
            openerTab.url.startsWith('http') &&
            openerTab.url) ||
            tab.url,
          domainPattern
        )
      ) {
        continue;
      }
      if (patternPreferences.excluded) {
        for (const excludedDomainPattern of Object.keys(
          patternPreferences.excluded
        )) {
          if (
            !this.utils.matchDomainPattern(request.url, excludedDomainPattern)
          ) {
            continue;
          }
          this.debug(
            '[shouldIsolateNavigation] not isolating because excluded domain pattern matches',
            request.url,
            excludedDomainPattern
          );
          return false;
        }
      }

      if (patternPreferences.navigation) {
        const navigationPreferences = patternPreferences.navigation;
        this.debug(
          '[shouldIsolateNavigation] found pattern',
          domainPattern,
          navigationPreferences
        );

        if (navigationPreferences.action === 'global') {
          this.debug('[shouldIsolateNavigation] breaking because "global"');
          break;
        }

        return await this.checkIsolationPreferenceAgainstUrl(
          navigationPreferences.action,
          parsedURL,
          parsedRequestURL.hostname
        );
      }
    }

    if (
      await this.checkIsolationPreferenceAgainstUrl(
        this.pref.isolation.global.navigation.action,
        parsedURL,
        parsedRequestURL.hostname
      )
    ) {
      return true;
    }

    this.debug('[shouldIsolateNavigation] not isolating');
    return false;
  }

  async shouldIsolateAlways({
    request,
    tab,
    openerTab,
  }: {
    tab?: Tab;
    request: browser.webRequest.WebRequestOnBeforeRequestDetails;
    openerTab?: Tab;
  }): Promise<boolean> {
    if (!tab || !tab.url) {
      this.debug(
        '[shouldIsolateAlways] we cant proceed without tab url information',
        tab,
        request
      );
      return false;
    }

    for (const patternPreferences of this.pref.isolation.domain) {
      const domainPattern = patternPreferences.pattern;
      if (!this.utils.matchDomainPattern(request.url, domainPattern)) {
        continue;
      }
      if (!patternPreferences.always) {
        continue;
      }

      const preferences = patternPreferences.always;
      this.debug(
        '[shouldIsolateAlways] found pattern for incoming request url',
        domainPattern,
        preferences
      );
      if (preferences.action === 'disabled') {
        this.debug(
          '[shouldIsolateAlways] not isolating because "always" disabled'
        );
        continue;
      }

      if (
        preferences.allowedInPermanent &&
        this.container.isPermanent(tab.cookieStoreId)
      ) {
        this.debug(
          '[shouldIsolateAlways] not isolating because disabled in permanent container'
        );
        continue;
      }

      const isTemporary = this.container.isTemporary(tab.cookieStoreId);
      if (!isTemporary) {
        this.debug(
          '[shouldIsolateAlways] isolating because not in a tmp container'
        );
        return true;
      }

      if (preferences.allowedInTemporary && isTemporary) {
        this.debug(
          '[shouldIsolateAlways] not isolating because disabled in tmp container'
        );
        return false;
      }

      if (!this.utils.matchDomainPattern(tab.url, domainPattern)) {
        let openerMatches = false;
        if (
          openerTab &&
          openerTab.url.startsWith('http') &&
          this.utils.matchDomainPattern(openerTab.url, domainPattern)
        ) {
          openerMatches = true;
          this.debug(
            '[shouldIsolateAlways] opener tab url matched the pattern',
            openerTab.url,
            domainPattern
          );
        }
        if (!openerMatches) {
          this.debug(
            '[shouldIsolateAlways] isolating because the tab/opener url doesnt match the pattern',
            tab.url,
            openerTab,
            domainPattern
          );
          return true;
        }
      }
    }
    return false;
  }

  shouldIsolateMac({
    tab,
    macAssignment,
  }: {
    tab?: Tab;
    macAssignment?: MacAssignment;
  }): boolean {
    if (this.pref.isolation.mac.action === 'disabled') {
      this.debug('[shouldIsolateMac] mac isolation disabled');
      return false;
    }
    if (tab && !this.container.isPermanent(tab.cookieStoreId)) {
      this.debug('[shouldIsolateMac] we are not in a permanent container');
      return false;
    }
    if (
      !macAssignment ||
      (macAssignment &&
        tab &&
        tab.cookieStoreId !== macAssignment.cookieStoreId)
    ) {
      this.debug(
        '[shouldIsolateMac] mac isolating because request url is not assigned to the tabs container'
      );
      return true;
    }
    this.debug('[shouldIsolateMac] no mac isolation', tab, macAssignment);
    return false;
  }

  async checkIsolationPreferenceAgainstUrl(
    preference: IsolationAction,
    origin: string,
    target: string
  ): Promise<boolean> {
    this.debug(
      '[checkIsolationPreferenceAgainstUrl]',
      preference,
      origin,
      target
    );
    switch (preference) {
      case 'always':
        this.debug(
          '[checkIsolationPreferenceAgainstUrl] isolating based on "always"'
        );
        return true;

      case 'notsamedomainexact':
        if (target !== origin) {
          this.debug(
            '[checkIsolationPreferenceAgainstUrl] isolating based on "notsamedomainexact"'
          );
          return true;
        }

      case 'notsamedomain':
        if (!this.utils.sameDomain(origin, target)) {
          this.debug(
            '[checkIsolationPreferenceAgainstUrl] isolating based on "notsamedomain"'
          );
          return true;
        }
    }
    return false;
  }

  // Moved logic from commands.ts to create this utility function.
  // preferences.ts might be able to use this as well, but I'm not sure how the Vue persistence might get in the way
  setIsolation(active: boolean): void {
    this.background.storage.local.preferences.isolation.active = active;
    this.background.storage.persist();
    if (this.background.storage.local.preferences.isolation.active) {
      this.background.browseraction.removeIsolationInactiveBadge();
      this.intervalIsolationStop();
    } else {
      this.background.browseraction.addIsolationInactiveBadge();
      this.intervalIsolationStart();
    }
  }

  intervalIsolationMethod(): void {
    const diff: number = this.intervalIsolationTarget - new Date().getTime();
    this.debug('[interval] isolation', diff, 'milliseconds');
    if (diff <= 0) {
      this.intervalIsolationStop();
      this.setIsolation(true);
    } else {
      this.background.browseraction.addIsolationInactiveBadge(
        Math.round(diff / 1000)
      );
    }
  }

  intervalIsolationStart(): void {
    if (this.pref.isolation.autoIsolateDelay > 0) {
      this.intervalIsolationTarget =
        new Date().getTime() + this.pref.isolation.autoIsolateDelay * 1000;
      this.intervalIsolationInterval = window.setInterval(() => {
        this.intervalIsolationMethod();
      }, 1000);
    }
  }

  intervalIsolationStop(): void {
    if (this.intervalIsolationInterval) {
      window.clearInterval(this.intervalIsolationInterval);
      this.intervalIsolationInterval = 0;
    }
  }
}
