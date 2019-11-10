import { TemporaryContainers } from '../background';
import { Isolation } from './isolation';
import { delay } from './lib';
import { debug } from './log';
import { PreferencesSchema, IsolationAction } from './preferences';
import { Utils } from './utils';

type ClickType = 'middle' | 'left' | 'ctrlleft';

interface ClickMessage {
  href: string;
  event: { button: number; ctrlKey: boolean; metaKey: boolean };
}

export class MouseClick {
  public isolated: {
    [key: string]: {
      clickType: ClickType;
      tab: browser.tabs.Tab;
      count: number;
      abortController: AbortController;
    };
  } = {};

  private background: TemporaryContainers;
  private pref!: PreferencesSchema;
  private utils!: Utils;
  private isolation!: Isolation;

  constructor(background: TemporaryContainers) {
    this.background = background;
    this.isolated = {};
  }

  public initialize() {
    this.pref = this.background.pref;
    this.utils = this.background.utils;
    this.isolation = this.background.isolation;
  }

  public linkClicked(
    message: ClickMessage,
    sender: browser.runtime.MessageSender
  ) {
    let clickType: ClickType | false = false;
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

    if (!clickType || !sender.tab) {
      return;
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

  public checkClickPreferences = (
    preferences: { action: IsolationAction },
    parsedClickedURL: { hostname: string },
    parsedSenderTabURL: { hostname: string }
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

  public checkClick(
    type: ClickType,
    message: ClickMessage,
    sender: browser.runtime.MessageSender
  ) {
    const parsedSenderTabURL = new URL(sender.tab!.url!);
    const parsedClickedURL = new URL(message.href);
    debug('[checkClick] checking click', type, message, sender);

    for (const domainPatternPreferences of this.pref.isolation.domain) {
      const domainPattern = domainPatternPreferences.pattern;
      if (!this.isolation.matchDomainPattern(sender.tab!.url!, domainPattern)) {
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

  public beforeHandleRequest(request: any) {
    if (!this.isolated[request.url]) {
      return;
    }
    debug(
      '[beforeHandleRequest] aborting isolated mouseclick cleanup',
      request.url
    );
    this.isolated[request.url].abortController.abort();
  }

  public afterHandleRequest(request: any) {
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
