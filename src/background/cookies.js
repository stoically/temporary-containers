class Cookies {
  constructor(background) {
    this.background = background;
  }


  initialize() {
    this.storage = this.background.storage;
    this.isolation = this.background.isolation;

    browser.webRequest.onBeforeSendHeaders.addListener(async details => {
      return this.maybeSetAndAddToHeader(details);
    }, {
      urls: ['<all_urls>'],
      types: ['main_frame']
    }, [
      'blocking', 'requestHeaders'
    ]);
  }


  async maybeSetAndAddToHeader(details) {
    if (details.tabId < 0 || !Object.keys(this.storage.local.preferences.cookies.domain).length) {
      return;
    }

    let tab;
    try {
      let cookieHeader;
      let cookiesHeader = {};
      let cookieHeaderChanged = false;
      for (let domainPattern in this.storage.local.preferences.cookies.domain) {
        if (!this.isolation.matchDomainPattern(details.url, domainPattern)) {
          continue;
        }
        if (!tab) {
          tab = await browser.tabs.get(details.tabId);
          if (!this.storage.local.tempContainers[tab.cookieStoreId]) {
            debug('[maybeSetAndAddCookiesToHeader] not a temporary container', tab);
            return;
          }

          cookieHeader = details.requestHeaders.find(element => element.name.toLowerCase() === 'cookie');
          if (cookieHeader) {
            cookiesHeader = cookieHeader.value.split('; ').reduce((accumulator, cookie) => {
              const split = cookie.split('=');
              if (split.length === 2) {
                accumulator[split[0]] = split[1];
              }
              return accumulator;
            }, {});
          }
          debug('[maybeAddCookiesToHeader] found temp tab and header', details, cookieHeader, cookiesHeader);
        }

        for (let cookie of this.storage.local.preferences.cookies.domain[domainPattern]) {
          if (!cookie) {
            continue;
          }
          // website pattern matched request, set cookie
          const setCookie = {
            domain: cookie.domain || undefined,
            expirationDate: cookie.expirationDate ? parseInt(cookie.expirationDate) : undefined,
            firstPartyDomain: cookie.firstPartyDomain || undefined,
            httpOnly: cookie.httpOnly === '' ? undefined : (cookie.httpOnly === 'true' ? true : false),
            name: cookie.name,
            path: cookie.path || undefined,
            secure: cookie.secure === '' ? undefined : (cookie.secure === 'true' ? true : false),
            url: cookie.url,
            value: cookie.value || undefined,
            sameSite: cookie.sameSite || undefined,
            storeId: tab.cookieStoreId
          };
          debug('[maybeSetCookies] setting cookie', cookie, setCookie);
          const cookieSet = await browser.cookies.set(setCookie);
          debug('[maybeSetCookies] cookie set', cookieSet);

          if (cookiesHeader[cookie.name] === cookie.value) {
            debug('[maybeSetCookies] the set cookie is already in the header', cookie, cookiesHeader);
            continue;
          }

          // check if we're allowed to send the cookie with the current request
          const cookieAllowed = await browser.cookies.get({
            name: cookie.name,
            url: details.url,
            storeId: tab.cookieStoreId
          });
          debug('[maybeAddCookiesToHeader] checked if allowed to add cookie to header', cookieAllowed);

          if (cookieAllowed) {
            cookieHeaderChanged = true;
            cookiesHeader[cookieAllowed.name] = cookieAllowed.value;
            debug('[maybeAddCookiesToHeader] cookie value changed', cookiesHeader);
          }
        }
      }
      debug('[maybeAddCookiesToHeader] cookieHeaderChanged', cookieHeaderChanged, cookieHeader, cookiesHeader);
      if (!cookieHeaderChanged) {
        return;
      } else {
        const changedCookieHeaderValues = [];
        Object.keys(cookiesHeader).map(cookieName => {
          changedCookieHeaderValues.push(`${cookieName}=${cookiesHeader[cookieName]}`);
        });
        const changedCookieHeaderValue = changedCookieHeaderValues.join('; ');
        debug('[maybeAddCookiesToHeader] changedCookieHeaderValue', changedCookieHeaderValue);
        if (cookieHeader) {
          cookieHeader.value = changedCookieHeaderValue;
        } else {
          details.requestHeaders.push({
            name: 'Cookie',
            value: changedCookieHeaderValue
          });
        }
        debug('[maybeAddCookiesToHeader] changed cookieHeader to', cookieHeader, details);
        return details;
      }
    } catch (error) {
      debug('[maybeAddCookiesToHeader] something went wrong while adding cookies to header', tab, details.url, error);
      return;
    }
  }
}

window.Cookies = Cookies;