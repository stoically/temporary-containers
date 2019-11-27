import { debug } from './log';

export class Isolation {
  private background: any;
  private pref: any;
  private container: any;
  private request: any;
  private mouseclick: any;
  private mac: any;
  private management: any;
  private utils: any;

  constructor(background) {
    this.background = background;
  }

  initialize() {
    this.pref = this.background.pref;
    this.container = this.background.container;
    this.request = this.background.request;
    this.mouseclick = this.background.mouseclick;
    this.mac = this.background.mac;
    this.management = this.background.management;
    this.utils = this.background.utils;
  }

  async maybeIsolate({ tab, request, openerTab, macAssignment }) {
    if (!this.pref.isolation.active) {
      debug('[maybeIsolate] isolation is disabled');
      return;
    }
    if (
      tab &&
      request &&
      request.originUrl &&
      this.mac.isConfirmPage(request.originUrl)
    ) {
      debug('[maybeIsolate] we are coming from a mac confirm page');
      this.mac.containerConfirmed[tab.id] = tab.cookieStoreId;
      return;
    }

    if (
      this.mouseclick.isolated[request.url] &&
      tab &&
      tab.cookieStoreId !== `${this.background.containerPrefix}-default` &&
      this.container.urlCreatedContainer[request.url] === tab.cookieStoreId
    ) {
      debug(
        '[maybeIsolate] link click already created this container, we can stop here',
        request,
        tab
      );
      return;
    }

    if (
      !(await this.shouldIsolate({ tab, request, openerTab, macAssignment }))
    ) {
      debug('[maybeIsolate] decided to not isolate', tab, request);
      return false;
    }
    debug('[maybeIsolate] decided to isolate', tab, request);

    const excludedDomainPatterns = Object.keys(
      this.pref.isolation.global.excluded
    );
    if (excludedDomainPatterns.length) {
      const excluded = excludedDomainPatterns.find(excludedDomainPattern => {
        return this.matchDomainPattern(request.url, excludedDomainPattern);
      });
      if (excluded) {
        debug(
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
      debug('[maybeIsolate] container on global excluded containers list', tab);
      return false;
    }

    if (
      macAssignment &&
      tab &&
      this.mac.containerConfirmed[tab.id] &&
      tab.cookieStoreId === this.mac.containerConfirmed[tab.id]
    ) {
      debug(
        '[maybeIsolate] mac confirmed container, not isolating',
        this.mac.containerConfirmed,
        macAssignment
      );
      return;
    }

    debug('[maybeIsolate] isolating', tab, request);
    if (this.request.cancelRequest(request)) {
      debug('[maybeIsolate] canceling request');
      return { cancel: true };
    }

    if (
      macAssignment &&
      (!tab || (tab && tab.cookieStoreId !== macAssignment.cookieStoreId))
    ) {
      debug(
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
      reload ||
      tab.url === 'about:home' ||
      tab.url === 'about:newtab' ||
      tab.url === 'about:blank' ||
      this.pref.replaceTabs
    ) {
      await this.container.reloadTabInTempContainer(params);
    } else {
      await this.container.createTabInTempContainer(params);
    }
    return { cancel: true };
  }

  async shouldIsolate({ tab, request, openerTab, macAssignment }) {
    debug('[shouldIsolate]', tab, request);

    // special-case TST group tabs #264
    if (
      openerTab &&
      this.management.addons['treestyletab@piro.sakura.ne.jp'].enabled
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
          debug(
            '[shouldIsolate] not isolating because originated from TST group tag',
            openerTab,
            tab,
            request
          );
          return false;
        }
      } catch (error) {
        debug('[shouldIsolate] failed contacting TST', error.toString());
      }
    }

    return (
      this.shouldIsolateMouseClick({ request, tab, openerTab }) ||
      this.shouldIsolateMac({ tab, macAssignment }) ||
      (await this.shouldIsolateNavigation({ request, tab, openerTab })) ||
      (await this.shouldIsolateAlways({ request, tab, openerTab }))
    );
  }

  shouldIsolateMouseClick({ request, tab, openerTab }) {
    if (!this.mouseclick.isolated[request.url]) {
      return false;
    }

    if (
      tab &&
      ![tab.id, tab.openerTabId].includes(
        this.mouseclick.isolated[request.url].tab.id
      )
    ) {
      debug(
        '[shouldIsolateMouseClick] not isolating mouse click because tab/openerTab id is different',
        request,
        tab,
        openerTab,
        this.mouseclick.isolated[request.url].tab
      );
      return false;
    }

    debug(
      '[beforeHandleRequest] decreasing isolated mouseclick count',
      this.mouseclick.isolated[request.url]
    );
    this.mouseclick.isolated[request.url].count--;

    if (this.mouseclick.isolated[request.url].count < 0) {
      debug(
        '[shouldIsolateMouseClick] not isolating and removing isolated mouseclick because its count is < 0',
        this.mouseclick.isolated[request.url]
      );
      this.mouseclick.isolated[request.url].abortController.abort();
      delete this.mouseclick.isolated[request.url];
      return false;
    }

    if (!this.mouseclick.isolated[request.url].count) {
      debug(
        '[shouldIsolateMouseClick] removing isolated mouseclick because its count is 0',
        this.mouseclick.isolated[request.url]
      );
      this.mouseclick.isolated[request.url].abortController.abort();
      delete this.mouseclick.isolated[request.url];
    }

    debug(
      '[shouldIsolateMouseClick] decided to isolate mouseclick',
      this.mouseclick.isolated[request.url]
    );
    return true;
  }

  async shouldIsolateNavigation({ request, tab, openerTab }) {
    if (!tab || !tab.url) {
      debug(
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
      debug(
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
      debug(
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
        : new URL(url);
    const parsedRequestURL = new URL(request.url);

    for (const patternPreferences of this.pref.isolation.domain) {
      const domainPattern = patternPreferences.pattern;

      if (
        !this.matchDomainPattern(
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
          if (!this.matchDomainPattern(request.url, excludedDomainPattern)) {
            continue;
          }
          debug(
            '[shouldIsolateNavigation] not isolating because excluded domain pattern matches',
            request.url,
            excludedDomainPattern
          );
          return false;
        }
      }

      if (patternPreferences.navigation) {
        const navigationPreferences = patternPreferences.navigation;
        debug(
          '[shouldIsolateNavigation] found pattern',
          domainPattern,
          navigationPreferences
        );

        if (navigationPreferences.action === 'global') {
          debug('[shouldIsolateNavigation] breaking because "global"');
          break;
        }

        return await this.checkIsolationPreferenceAgainstUrl(
          navigationPreferences.action,
          parsedURL.hostname,
          parsedRequestURL.hostname,
          tab
        );
      }
    }

    if (
      await this.checkIsolationPreferenceAgainstUrl(
        this.pref.isolation.global.navigation.action,
        parsedURL.hostname,
        parsedRequestURL.hostname,
        tab
      )
    ) {
      return true;
    }

    debug('[shouldIsolateNavigation] not isolating');
    return false;
  }

  async shouldIsolateAlways({ request, tab, openerTab }) {
    if (!tab || !tab.url) {
      debug(
        '[shouldIsolateAlways] we cant proceed without tab url information',
        tab,
        request
      );
      return false;
    }

    for (const patternPreferences of this.pref.isolation.domain) {
      const domainPattern = patternPreferences.pattern;
      if (!this.matchDomainPattern(request.url, domainPattern)) {
        continue;
      }
      if (!patternPreferences.always) {
        continue;
      }

      const preferences = patternPreferences.always;
      debug(
        '[shouldIsolateAlways] found pattern for incoming request url',
        domainPattern,
        preferences
      );
      if (preferences.action === 'disabled') {
        debug('[shouldIsolateAlways] not isolating because "always" disabled');
        continue;
      }

      if (
        preferences.allowedInPermanent &&
        this.container.isPermanent(tab.cookieStoreId)
      ) {
        debug(
          '[shouldIsolateAlways] not isolating because disabled in permanent container'
        );
        continue;
      }

      const isTemporary = this.container.isTemporary(tab.cookieStoreId);
      if (!isTemporary) {
        debug('[shouldIsolateAlways] isolating because not in a tmp container');
        return true;
      }

      if (preferences.allowedInTemporary && isTemporary) {
        debug(
          '[shouldIsolateAlways] not isolating because disabled in tmp container'
        );
        return false;
      }

      if (!this.matchDomainPattern(tab.url, domainPattern)) {
        let openerMatches = false;
        if (
          openerTab &&
          openerTab.url.startsWith('http') &&
          this.matchDomainPattern(openerTab.url, domainPattern)
        ) {
          openerMatches = true;
          debug(
            '[shouldIsolateAlways] opener tab url matched the pattern',
            openerTab.url,
            domainPattern
          );
        }
        if (!openerMatches) {
          debug(
            '[shouldIsolateAlways] isolating because the tab/opener url doesnt match the pattern',
            tab.url,
            openerTab,
            domainPattern
          );
          return true;
        }
      }
    }
  }

  shouldIsolateMac({ tab, macAssignment }) {
    if (this.pref.isolation.mac.action === 'disabled') {
      debug('[shouldIsolateMac] mac isolation disabled');
      return false;
    }
    if (!this.container.isPermanent(tab.cookieStoreId)) {
      debug('[shouldIsolateMac] we are not in a permanent container');
      return false;
    }
    if (
      !macAssignment ||
      (macAssignment && tab.cookieStoreId !== macAssignment.cookieStoreId)
    ) {
      debug(
        '[shouldIsolateMac] mac isolating because request url is not assigned to the tabs container'
      );
      return true;
    }
    debug('[shouldIsolateMac] no mac isolation', tab, macAssignment);
    return false;
  }

  async checkIsolationPreferenceAgainstUrl(preference, origin, target, tab) {
    debug(
      '[checkIsolationPreferenceAgainstUrl]',
      preference,
      origin,
      target,
      tab
    );
    switch (preference) {
      case 'always':
        debug(
          '[checkIsolationPreferenceAgainstUrl] isolating based on "always"'
        );
        return true;

      case 'notsamedomainexact':
        if (target !== origin) {
          debug(
            '[checkIsolationPreferenceAgainstUrl] isolating based on "notsamedomainexact"'
          );
          return true;
        }
        return false;

      case 'notsamedomain':
        if (!this.utils.sameDomain(origin, target)) {
          debug(
            '[checkIsolationPreferenceAgainstUrl] isolating based on "notsamedomain"'
          );
          return true;
        }
        return false;
    }
  }

  matchDomainPattern(url, domainPattern) {
    if (domainPattern.startsWith('/')) {
      const regexp = domainPattern.match(/^\/(.*)\/([gimsuy]+)?$/);
      try {
        return new RegExp(regexp[1], regexp[2]).test(url);
      } catch (error) {
        return false;
      }
    } else {
      const parsedUrl =
        url.startsWith('about:') || url.startsWith('moz-extension:')
          ? url
          : new URL(url);
      return (
        parsedUrl.hostname === domainPattern ||
        this.utils.globToRegexp(domainPattern).test(parsedUrl.hostname)
      );
    }
  }
}
