class Isolation {
  constructor(background) {
    this.background = background;
  }

  initialize() {
    this.storage = this.background.storage;
    this.container = this.background.container;
    this.request = this.background.request;
    this.mouseclick = this.background.mouseclick;
    this.mac = this.background.mac;
    this.utils = this.background.utils;
  }

  async maybeIsolate({tab, request, openerTab, macAssignment}) {
    if (this.mouseclick.linksClicked[request.url] && tab && tab.cookieStoreId !== 'firefox-default' &&
      this.container.urlCreatedContainer[request.url] === tab.cookieStoreId) {
      debug('[maybeIsolate] link click already created this container, we can stop here', request, tab);
      return;
    }

    if (!await this.shouldIsolate({tab, request, openerTab, macAssignment}) && !this.mouseclick.linksClicked[request.url]) {
      debug('[maybeIsolate] decided to not isolate', tab, request);
      return false;
    }
    debug('[maybeIsolate] decided to isolate', tab, request);

    const excludedDomainPatterns = Object.keys(this.storage.local.preferences.isolation.global.excluded);
    if (excludedDomainPatterns.length) {
      const excluded = excludedDomainPatterns.find(excludedDomainPattern => {
        return this.matchDomainPattern(request.url, excludedDomainPattern);
      });
      if (excluded) {
        debug('[maybeIsolate] request url matches global excluded domain pattern', request, excludedDomainPatterns);
        return false;
      }
    }

    if (tab && this.container.isPermanent(tab.cookieStoreId) &&
      this.storage.local.preferences.isolation.global.excludedContainers[tab.cookieStoreId]) {
      debug('[maybeIsolate] container on global excluded containers list', tab);
      return false;
    }

    debug('[maybeIsolate] isolating', tab, request);
    if (this.request.cancelRequest(request)) {
      debug('[maybeIsolate] canceling request');
      return { cancel: true };
    }

    if (macAssignment && (!tab || (tab && tab.cookieStoreId !== macAssignment.cookieStoreId))) {
      debug('[maybeIsolate] decided to reopen but mac assigned, maybe reopen confirmpage', request, tab, macAssignment);
      this.mac.maybeReopenConfirmPage(macAssignment, request, tab);
      return false;
    }

    const params = {
      tab,
      url: request.url,
      request,
      deletesHistory: this.storage.local.preferences.deletesHistory.containerIsolation === 'automatic'
    };
    if (this.mouseclick.linksClicked[request.url] &&
        this.mouseclick.linksClicked[request.url].clickType === 'left' &&
        !this.storage.local.preferences.replaceTabs) {
      debug('[maybeIsolate] creating new container because request got left clicked', this.mouseclick.linksClicked[request.url], tab);
      await this.container.createTabInTempContainer(params);
      if (tab && this.mouseclick.linksClicked[request.url].tab.id !== tab.id) {
        debug('[maybeIsolate] looks like the left clicked opened a new tab, remove it', tab);
        await this.tabs.remove(tab);
      }
    } else if (this.mouseclick.linksClicked[request.url] ||
      tab.url === 'about:home' || tab.url === 'about:newtab' || tab.url === 'about:blank' ||
      this.storage.local.preferences.replaceTabs) {
      await this.container.reloadTabInTempContainer(params);
    } else {
      await this.container.createTabInTempContainer(params);
    }
    return {cancel: true};
  }


  async shouldIsolate({tab, request, openerTab, macAssignment}) {
    debug('[shouldIsolate]', tab, request);
    if (!tab || !tab.url) {
      debug('[shouldIsolate] we cant proceed without tab url information', tab, request);
      return false;
    }

    if (this.container.isClean(tab.cookieStoreId)) {
      debug('[maybeAlwaysOpenInTemporaryContainer] not reopening because the tmp container is still clean');
      if (!this.request.cleanRequests[request.requestId]) {
        this.request.cleanRequests[request.requestId] = true;
        delay(300000).then(() => {
          delete this.request.cleanRequests[request.requestId];
        });
      }
      return false;
    }

    if (this.request.cleanRequests[request.requestId]) {
      debug('[maybeAlwaysOpenInTemporaryContainer] not reopening because of clean requests, redirect', request);
      return false;
    }

    return this.shouldIsolateMac({tab, macAssignment}) ||
      (!macAssignment && await this.shouldIsolateNavigation({request, tab, openerTab})) ||
      (!macAssignment && await this.shouldIsolateAlways({request, tab, openerTab}));
  }

  async shouldIsolateNavigation({request, tab, openerTab}) {
    if ((tab.url === 'about:blank' || tab.url === 'about:newtab' || tab.url === 'about:home') && !openerTab) {
      debug('[shouldIsolate] not isolating because the tab url is blank/newtab/home and no openerTab');
      return false;
    }

    if (openerTab && tab.url === 'about:blank' && this.container.isPermanent(tab.cookieStoreId) &&
      openerTab.cookieStoreId !== tab.cookieStoreId) {
      debug('[shouldIsolate] the tab loads a permanent container that is different from the openerTab, probaby explicitly selected in the context menu');
      return false;
    }

    const url = this.request.lastSeenRequestUrl[request.requestId] &&
      this.request.lastSeenRequestUrl[request.requestId] !== tab.url ?
      this.request.lastSeenRequestUrl[request.requestId] : tab.url === 'about:blank' && openerTab && openerTab.url || tab.url;
    const parsedURL = new URL(url);
    const parsedRequestURL = new URL(request.url);

    for (let domainPattern in this.storage.local.preferences.isolation.domain) {
      const patternPreferences = this.storage.local.preferences.isolation.domain[domainPattern];
      if (!this.matchDomainPattern(
        tab.url === 'about:blank' && openerTab && openerTab.url || tab.url, domainPattern
      )) {
        continue;
      }
      if (patternPreferences.excluded) {
        for (const excludedDomainPattern of Object.keys(patternPreferences.excluded)) {
          if (!this.matchDomainPattern(request.url, excludedDomainPattern)) {
            continue;
          }
          debug('[shouldIsolate] not isolating because excluded domain pattern matches', request.url, excludedDomainPattern);
          return false;
        }
      }

      if (patternPreferences.navigation) {
        const navigationPreferences = patternPreferences.navigation;
        debug('[shouldIsolate] found pattern', domainPattern, navigationPreferences);

        if (navigationPreferences.action === 'global') {
          debug('[shouldIsolate] breaking because "global"');
          break;
        }

        return await this.checkIsolationPreferenceAgainstUrl(
          navigationPreferences.action, parsedURL.hostname, parsedRequestURL.hostname, tab
        );
      }
    }

    if (await this.checkIsolationPreferenceAgainstUrl(
      this.storage.local.preferences.isolation.global.navigation.action,
      parsedURL.hostname,
      parsedRequestURL.hostname,
      tab
    )) {
      return true;
    }

    debug('[shouldIsolate] not isolating');
    return false;
  }

  async shouldIsolateAlways({request, tab, openerTab}) {
    for (let domainPattern in this.storage.local.preferences.isolation.domain) {
      const patternPreferences = this.storage.local.preferences.isolation.domain[domainPattern];
      if (!this.matchDomainPattern(request.url, domainPattern)) {
        continue;
      }
      if (patternPreferences.always) {
        const preferences = patternPreferences.always;
        debug('[maybeAlwaysOpenInTemporaryContainer] found pattern for incoming request url', domainPattern, preferences);
        if (preferences.action === 'disabled') {
          debug('[maybeAlwaysOpenInTemporaryContainer] not reopening because "always" disabled');
          continue;
        }

        if (preferences.allowedInPermanent && this.container.isPermanent(tab.cookieStoreId)) {
          debug('[maybeAlwaysOpenInTemporaryContainer] not reopening because allowed to load in permanent container');
          continue;
        }

        if (!this.container.isTemporary(tab.cookieStoreId)) {
          debug('[maybeAlwaysOpenInTemporaryContainer] reopening because not in a tmp container');
          return true;
        }

        if (!this.matchDomainPattern(tab.url, domainPattern)) {
          let openerMatches = false;
          if (openerTab && !openerTab.url.startsWith('about:') &&
              this.matchDomainPattern(openerTab.url, domainPattern)) {
            openerMatches = true;
            debug('[maybeAlwaysOpenInTemporaryContainer] opener tab url matched the pattern', openerTab.url, domainPattern);
          }
          if (!openerMatches) {
            debug('[maybeAlwaysOpenInTemporaryContainer] reopening because the tab/opener url doesnt match the pattern', tab.url, openerTab, domainPattern);
            return true;
          }
        }
      }
    }
  }

  shouldIsolateMac({tab, macAssignment}) {
    if (this.storage.local.preferences.isolation.mac.action === 'disabled') {
      debug('[shouldIsolateMac] mac isolation disabled');
      return false;
    }
    if (!macAssignment || (macAssignment && tab.cookieStoreId !== macAssignment.cookieStoreId)) {
      debug('[shouldIsolateMac] mac isolating because request url is not assigned to the tabs container');
      return true;
    }
    debug('[shouldIsolateMac] no mac isolation', tab, macAssignment);
    return false;
  }

  async checkIsolationPreferenceAgainstUrl(preference, origin, target, tab) {
    debug('[checkIsolationPreferenceAgainstUrl]', preference, origin, target, tab);
    switch (preference) {
    case 'always':
      debug('[checkIsolationPreferenceAgainstUrl] isolating based on "always"');
      return true;

    case 'notsamedomainexact':
      if (target !== origin) {
        debug('[checkIsolationPreferenceAgainstUrl] isolating based on "notsamedomainexact"');
        return true;
      }
      return false;

    case 'notsamedomain':
      if (!this.utils.sameDomain(origin, target)) {
        debug('[checkIsolationPreferenceAgainstUrl] isolating based on "notsamedomain"');
        return true;
      }
      return false;
    }
  }

  matchDomainPattern(url, domainPattern) {
    if (domainPattern.startsWith('/')) {
      const regexp = domainPattern.match(/^\/(.*)\/([gimsuy]+)?$/);
      try {
        return (new RegExp(regexp[1], regexp[2])).test(url);
      } catch (error) {
        return false;
      }
    } else {
      const parsedUrl = new URL(url);
      return parsedUrl.hostname === domainPattern ||
             globToRegexp(domainPattern).test(parsedUrl.hostname);
    }
  }
}

window.Isolation = Isolation;