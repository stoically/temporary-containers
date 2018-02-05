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
    let url;
    let clickType;
    if (typeof message !== 'object') {
      url = message;
    } else {
      url = message.linkClicked.href;
      if (message.linkClicked.event.button === 1) {
        clickType = 'middle';
      } else if (message.linkClicked.event.button === 0 &&
        (message.linkClicked.event.ctrlKey || message.linkClicked.event.metaKey)) {
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
      this.background.emit('cleanupAutomaticModeState', url);
    }, 1000);
  }


  checkClickPreferences(preferences, parsedClickedURL, parsedSenderTabURL) {
    if (preferences.action === 'never') {
      return false;
    }

    if (preferences.action === 'notsamedomainexact') {
      if (parsedSenderTabURL.hostname !== parsedClickedURL.hostname) {
        debug('[browser.runtime.onMessage] click not handled based on global preference "notsamedomainexact"');
        return true;
      } else {
        debug('[browser.runtime.onMessage] click handled based on global preference "notsamedomainexact"');
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
        debug('[browser.runtime.onMessage] click handled from global preference "notsamedomain"');
        return false;
      } else {
        debug('[browser.runtime.onMesbrowser.commands.onCommand.addListenersage] click not handled from global preference "notsamedomain"');
        return true;
      }
    }

    return true;
  }


  checkClick(type, message, sender) {
    const parsedSenderTabURL = new URL(sender.tab.url);
    const parsedClickedURL = new URL(message.linkClicked.href);

    for (let domainPattern in this.storage.local.preferences.linkClickDomain) {
      if (parsedSenderTabURL.hostname !== domainPattern &&
          !parsedSenderTabURL.hostname.match(globToRegexp(domainPattern))) {
        continue;
      }
      const domainPatternPreferences = this.storage.local.preferences.linkClickDomain[domainPattern];
      if (!domainPatternPreferences[type]) {
        continue;
      }
      return this.checkClickPreferences(domainPatternPreferences[type],
        parsedClickedURL, parsedSenderTabURL);
    }

    return this.checkClickPreferences(this.storage.local.preferences.linkClickGlobal[type],
      parsedClickedURL, parsedSenderTabURL);
  }
}

module.exports = MouseClick;
