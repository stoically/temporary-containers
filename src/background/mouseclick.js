const { globToRegexp } = require('./utils');
const { debug } = require('./log');

class MouseClick {
  constructor() {
    this.linksClicked = {};
  }


  initialize(background) {
    this.background = background;
    this.storage = background.storage;
    this.container = background.container;
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
        return;
      }
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

    setTimeout(() => {
      debug('[runtimeOnMessage] cleaning up', url);
      delete this.linksClicked[url];
      delete this.container.urlCreatedContainer[url];
    }, 1000);
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
      const splittedClickedHostname = parsedClickedURL.hostname.split('.');
      const checkHostname = '.' + (splittedClickedHostname.splice(-2).join('.'));
      const dottedParsedSenderTabURL = '.' + parsedSenderTabURL.hostname;

      if (parsedClickedURL.hostname.length > 1 &&
          (dottedParsedSenderTabURL.endsWith(checkHostname) ||
           checkHostname.endsWith(dottedParsedSenderTabURL))) {
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

    for (let domainPattern in this.storage.local.preferences.linkClickDomain) {
      if (parsedSenderTabURL.hostname !== domainPattern &&
          !parsedSenderTabURL.hostname.match(globToRegexp(domainPattern))) {
        continue;
      }
      const domainPatternPreferences = this.storage.local.preferences.linkClickDomain[domainPattern];
      if (!domainPatternPreferences[type]) {
        continue;
      }
      debug('[checkClick] per website pattern found', domainPatternPreferences[type]);
      return this.checkClickPreferences(domainPatternPreferences[type],
        parsedClickedURL, parsedSenderTabURL);
    }
    debug('[checkClick] no website pattern found, checking global preferences');
    return this.checkClickPreferences(this.storage.local.preferences.linkClickGlobal[type],
      parsedClickedURL, parsedSenderTabURL);
  }


  shouldOpenDeletesHistoryContainer(url) {
    if (this.linksClicked[url] &&
        this.linksClicked[url].clickType) {
      const clickType = this.linksClicked[url].clickType;
      if (this.storage.local.preferences.linkClickGlobal[clickType].container === 'deleteshistory') {
        return true;
      }
    }
    return false;
  }
}

module.exports = MouseClick;
