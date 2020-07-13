import {
  Debug,
  TabId,
  Tab,
  ProxyInfo,
  IPContextOnBeforeRequestResult,
} from '~/types';
import { TemporaryContainers } from './tmp';

interface Badge {
  prefix: string;
  stats: { routed: number; blocked: number };
}

export class IPContext {
  private background: TemporaryContainers;
  private debug: Debug;

  ipv6tabs: Set<number> = new Set();
  ipv6requests: Set<string> = new Set();
  badges: Map<number, Badge> = new Map();

  constructor(background: TemporaryContainers) {
    this.background = background;
    this.debug = this.background.debug;
  }

  initialize(): void {
    browser.browserAction.setBadgeBackgroundColor({ color: 'gray' });
  }

  async onProxyRequest(
    request: browser.webRequest.WebRequestOnBeforeRequestDetails
  ): Promise<ProxyInfo> {
    this.debug('proxy.onRequest', request);

    if (request.tabId === -1) {
      this.debug('proxy.onRequest: ignoring non-tab (-1) request', request);
      return { type: 'direct' };
    }

    const url = new URL(request.url);
    if (['localhost', '127.0.0.1', '::1'].includes(url.hostname)) {
      this.debug('proxy.onRequest: ignoring localhost request', request);
      return { type: 'direct' };
    }

    this.debug('proxy.onRequest: resolving dns', url.hostname);
    let ipv6 = false;
    try {
      const { addresses } = await browser.dns.resolve(url.hostname, [
        'disable_ipv4',
      ]);
      if (addresses && addresses.length) {
        ipv6 = true;
        this.ipv6requests.add(request.requestId);
      }
    } catch (error) {
      // dns.resolve throws if no addresses are found
    }

    if (request.type === 'main_frame') {
      if (!ipv6) {
        this.debug(
          'proxy.onRequest: ignoring ipv4-only main_frame',
          url.hostname
        );
        return { type: 'direct' };
      }

      this.ipv6tabs.add(request.tabId);
    } else {
      if (!this.ipv6tabs.has(request.tabId)) {
        this.debug(
          'proxy.onRequest: ignoring non-ipv6tab sub resource request',
          request
        );
        return { type: 'direct' };
      }
    }

    this.debug('proxy.onRequest: handling request', request, url.hostname);

    const contextId = request
      .cookieStoreId!.replace('firefox-default', '0')
      .replace('firefox-container-', '');

    return {
      type: 'socks',
      host: '::1',
      port: '3560',
      username: contextId,
      password: '',
      proxyDNS: true,
    };
  }

  async onBeforeRequest(
    request: browser.webRequest.WebRequestOnBeforeRequestDetails
  ): Promise<IPContextOnBeforeRequestResult> {
    this.debug('webRequest.onBeforeRequest', request);
    if (request.tabId === -1) {
      this.debug(
        'webRequest.onBeforeRequest: ignoring non-tab request',
        request
      );
      return {};
    }

    if (request.type === 'main_frame') {
      this.debug(
        'webRequest.onBeforeRequest: ignoring main_frame request',
        request
      );
      this.incrRouted(request.tabId);
      return {};
    }

    const ipv6tab = this.ipv6tabs.has(request.tabId);
    const ipv6request = this.ipv6requests.has(request.requestId);

    if (ipv6tab) {
      if (!ipv6request) {
        this.debug(
          'webRequest.onBeforeRequest: blocking ipv4-only request in ipv6tab',
          request
        );
        this.incrBlocked(request.tabId);
        return { cancel: true };
      } else {
        this.debug(
          'webRequest.onBeforeRequest: ignoring ipv6-capable request in ipv6tab',
          request
        );
        this.incrRouted(request.tabId);
        return {};
      }
    } else {
      const url = new URL(request.url);
      this.debug('proxy.onRequest: resolving dns', url.hostname);
      let ipv4 = false;
      try {
        const { addresses } = await browser.dns.resolve(url.hostname, [
          'disable_ipv6',
        ]);
        if (addresses && addresses.length) {
          ipv4 = true;
        }
      } catch (error) {
        // dns.resolve throws if no addresses are found
      }

      if (ipv4) {
        this.debug(
          'webRequest.onBeforeRequest: ignoring ipv4-capable request in ipv4tab',
          request
        );
        this.incrRouted(request.tabId);
        return {};
      } else {
        this.debug(
          'webRequest.onBeforeRequest: blocking ipv6-only request in ipv4tab'
        );
        this.incrBlocked(request.tabId);
        return { cancel: true };
      }
    }
  }

  requestCompleted(
    request: browser.webRequest.WebRequestOnBeforeRequestDetails
  ): void {
    this.ipv6requests.delete(request.requestId);
  }

  requestError(
    request: browser.webRequest.WebRequestOnBeforeRequestDetails
  ): void {
    this.ipv6requests.delete(request.requestId);
  }

  tabRemoved(tabId: TabId): void {
    this.ipv6tabs.delete(tabId);
  }

  tabCreated(tab: Tab): void {
    this.badges.set(tab.id, { prefix: '', stats: { routed: 0, blocked: 0 } });
  }

  tabUpdated(
    tabId: number,
    changeInfo: browser.tabs.TabsOnUpdatedEventChangeInfo,
    tab: Tab
  ): void {
    if (changeInfo.status && changeInfo.status === 'complete') {
      const badge = this.badges.get(tabId);
      if (!badge) {
        return;
      }

      if (this.ipv6tabs.has(tabId)) {
        badge.prefix = 'v6';
      } else {
        badge.prefix = 'v4';
      }
      this.updateBadge(tabId, badge);
    }
  }

  incrBlocked(tabId: TabId): void {
    const badge = this.badges.get(tabId);
    if (!badge) return;
    badge.stats.blocked++;

    this.updateBadge(tabId, badge);
  }

  incrRouted(tabId: TabId): void {
    const badge = this.badges.get(tabId);
    if (!badge) return;
    badge.stats.routed++;

    this.updateBadge(tabId, badge);
  }

  updateBadge(tabId: TabId, badge: Badge): void {
    browser.browserAction.setBadgeText({
      tabId,
      text: badge.prefix,
    });

    browser.browserAction.setTitle({
      tabId,
      title: `${badge.stats.routed}/${badge.stats.blocked}`,
    });
  }
}
