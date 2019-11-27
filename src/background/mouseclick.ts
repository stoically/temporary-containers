import { debug } from './log';
import { delay } from './lib';

export class MouseClick {
  private isolated = {};

  private background: any;
  private pref: any;
  private utils: any;
  private isolation: any;

  constructor(background) {
    this.background = background;
    this.isolated = {};
  }

  initialize() {
    this.pref = this.background.pref;
    this.utils = this.background.utils;
    this.isolation = this.background.isolation;
  }

  linkClicked(message, sender) {
    let clickType;
    const url = message.href;
    if (message.event.button === 1) {
      clickType = 'middle';
    } else if (
      message.event.button === 0 &&
      !message.event.ctrlKey &&
      !message.event.metaKey
    ) {
      clickType = 'left';
    } else if (
      message.event.button === 0 &&
      (message.event.ctrlKey || message.event.metaKey)
    ) {
      clickType = 'ctrlleft';
    }
    if (!this.checkClick(clickType, message, sender)) {
      return;
    }

    if (this.isolated[url]) {
      debug('[linkClicked] aborting isolated cleanup', url);
      this.isolated[url].abortController.abort();
    }

    const abortController = new AbortController();
    if (!this.isolated[url]) {
      this.isolated[url] = {
        clickType,
        tab: sender.tab,
        abortController,
        count: 0,
      };
    }
    this.isolated[url].count++;

    delay(1500, { signal: abortController.signal })
      .then(() => {
        debug('[linkClicked] cleaning up isolated', url);
        delete this.isolated[url];
      })
      .catch(debug);
  }

  checkClickPreferences = (
    preferences,
    parsedClickedURL,
    parsedSenderTabURL
  ) => {
    if (preferences.action === 'always') {
      debug(
        '[checkClick] click handled based on preference "always"',
        preferences
      );
      return true;
    }

    if (preferences.action === 'never') {
      debug(
        '[checkClickPreferences] click not handled based on preference "never"',
        preferences,
        parsedClickedURL,
        parsedSenderTabURL
      );
      return false;
    }

    if (preferences.action === 'notsamedomainexact') {
      if (parsedSenderTabURL.hostname !== parsedClickedURL.hostname) {
        debug(
          '[checkClickPreferences] click handled based on preference "notsamedomainexact"',
          preferences,
          parsedClickedURL,
          parsedSenderTabURL
        );
        return true;
      } else {
        debug(
          '[checkClickPreferences] click not handled based on preference "notsamedomainexact"',
          preferences,
          parsedClickedURL,
          parsedSenderTabURL
        );
        return false;
      }
    }

    if (preferences.action === 'notsamedomain') {
      if (
        this.utils.sameDomain(
          parsedSenderTabURL.hostname,
          parsedClickedURL.hostname
        )
      ) {
        debug(
          '[checkClickPreferences] click not handled from preference "notsamedomain"',
          parsedClickedURL,
          parsedSenderTabURL
        );
        return false;
      } else {
        debug(
          '[checkClickPreferences] click handled from preference "notsamedomain"',
          parsedClickedURL,
          parsedSenderTabURL
        );
        return true;
      }
    }

    debug('[checkClickPreferences] this should never happen');
    return false;
  };

  checkClick(type, message, sender) {
    const parsedSenderTabURL = new URL(sender.tab.url);
    const parsedClickedURL = new URL(message.href);
    debug('[checkClick] checking click', type, message, sender);

    for (const domainPatternPreferences of this.pref.isolation.domain) {
      const domainPattern = domainPatternPreferences.pattern;
      if (!this.isolation.matchDomainPattern(sender.tab.url, domainPattern)) {
        continue;
      }
      if (!domainPatternPreferences.mouseClick[type]) {
        continue;
      }
      const preferences = domainPatternPreferences.mouseClick[type];
      debug('[checkClick] per website pattern found');
      if (preferences.action === 'global') {
        debug('[checkClick] breaking because "global"');
        break;
      }
      return this.checkClickPreferences(
        preferences,
        parsedClickedURL,
        parsedSenderTabURL
      );
    }
    debug('[checkClick] no website pattern found, checking global preferences');
    return this.checkClickPreferences(
      this.pref.isolation.global.mouseClick[type],
      parsedClickedURL,
      parsedSenderTabURL
    );
  }

  beforeHandleRequest(request) {
    if (!this.isolated[request.url]) {
      return;
    }
    debug(
      '[beforeHandleRequest] aborting isolated mouseclick cleanup',
      request.url
    );
    this.isolated[request.url].abortController.abort();
  }

  afterHandleRequest(request) {
    if (!this.isolated[request.url]) {
      return;
    }
    this.isolated[request.url].abortController = new AbortController();
    delay(1500, { signal: this.isolated[request.url].abortController.signal })
      .then(() => {
        debug('[beforeHandleRequest] cleaning up isolated', request.url);
        delete this.isolated[request.url];
      })
      .catch(debug);
  }
}
