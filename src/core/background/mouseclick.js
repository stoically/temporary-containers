class MouseClick {
  constructor(background) {
    this.background = background;
    this.linksClicked = {};
    this.unhandledLinksClicked = {};

    this.checkClickPreferences.bind(this);
  }


  initialize() {
    this.storage = this.background.storage;
    this.container = this.background.container;
    this.utils = this.background.utils;
    this.isolation = this.background.isolation;
  }


  linkClicked(message, sender) {
    if (sender.tab.incognito) {
      debug('[linkClicked] message came from an incognito tab, we dont handle that', message, sender);
      return;
    }

    let url;
    let clickType;
    if (typeof message !== 'object') {
      url = message;
    } else {
      url = message.href;
      if (message.event.button === 1) {
        clickType = 'middle';
      } else if (message.event.button === 0 &&
                 !message.event.ctrlKey &&
                 !message.event.metaKey) {
        clickType = 'left';
      } else if (message.event.button === 0 &&
                (message.event.ctrlKey || message.event.metaKey)) {
        clickType = 'ctrlleft';
      }
      if (!this.checkClick(clickType, message, sender)) {
        this.unhandledLinksClicked[url] = {};
        delay(1000).then(() => {
          debug('[linkClicked] cleaning up unhandledLinksClicked', url);
          delete this.unhandledLinksClicked[url];
        });
        return;
      }
    }
    if (this.unhandledLinksClicked[url]) {
      delete this.unhandledLinksClicked[url];
    }
    const tab = sender.tab;

    if (!this.linksClicked[url]) {
      this.linksClicked[url] = {
        tabs: {},
        containers: {},
        count: 0
      };
    }
    this.linksClicked[url].clickType = clickType;
    this.linksClicked[url].tab = tab;
    this.linksClicked[url].tabs[tab.id] = true;
    this.linksClicked[url].containers[tab.cookieStoreId] = true;
    this.linksClicked[url].count++;

    delay(1000).then(() => {
      debug('[linkClicked] cleaning up linksClicked', url);
      delete this.linksClicked[url];
    });
  }


  checkClickPreferences(preferences, parsedClickedURL, parsedSenderTabURL) {
    if (preferences.action === 'always') {
      debug('[checkClick] click handled based on preference "always"', preferences);
      return true;
    }

    if (preferences.action === 'never') {
      debug('[checkClickPreferences] click not handled based on preference "never"',
        preferences, parsedClickedURL, parsedSenderTabURL);
      return false;
    }

    if (preferences.action === 'notsamedomainexact') {
      if (parsedSenderTabURL.hostname !== parsedClickedURL.hostname) {
        debug('[checkClickPreferences] click handled based on preference "notsamedomainexact"',
          preferences, parsedClickedURL, parsedSenderTabURL);
        return true;
      } else {
        debug('[checkClickPreferences] click not handled based on preference "notsamedomainexact"',
          preferences, parsedClickedURL, parsedSenderTabURL);
        return false;
      }
    }

    if (preferences.action === 'notsamedomain') {
      if (this.utils.sameDomain(parsedSenderTabURL.hostname, parsedClickedURL.hostname)) {
        debug('[checkClickPreferences] click not handled from preference "notsamedomain"',
          parsedClickedURL, parsedSenderTabURL);
        return false;
      } else {
        debug('[checkClickPreferences] click handled from preference "notsamedomain"',
          parsedClickedURL, parsedSenderTabURL);
        return true;
      }
    }

    debug('[checkClickPreferences] this should never happen');
    return false;
  }

  checkClick(type, message, sender) {
    const parsedSenderTabURL = new URL(sender.tab.url);
    const parsedClickedURL = new URL(message.href);
    debug('[checkClick] checking click', type, message, sender);

    for (let domainPattern in this.storage.local.preferences.isolation.domain) {
      if (!this.isolation.matchDomainPattern(sender.tab.url, domainPattern)) {
        continue;
      }
      const domainPatternPreferences = this.storage.local.preferences.isolation.domain[domainPattern].mouseClick;
      if (!domainPatternPreferences[type]) {
        continue;
      }
      const preferences = domainPatternPreferences[type];
      debug('[checkClick] per website pattern found', );
      if (preferences.action === 'global') {
        debug('[checkClick] breaking because "global"');
        break;
      }
      return this.checkClickPreferences(preferences,
        parsedClickedURL, parsedSenderTabURL);
    }
    debug('[checkClick] no website pattern found, checking global preferences');
    return this.checkClickPreferences(this.storage.local.preferences.isolation.global.mouseClick[type],
      parsedClickedURL, parsedSenderTabURL);
  }


  shouldOpenDeletesHistoryContainer(url) {
    if (this.linksClicked[url] &&
        this.linksClicked[url].clickType) {
      const clickType = this.linksClicked[url].clickType;
      if (this.storage.local.preferences.isolation.global.mouseClick[clickType].container === 'deleteshistory') {
        return true;
      }
    }
    return false;
  }
}

window.MouseClick = MouseClick;
