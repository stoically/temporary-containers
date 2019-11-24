import jsdom from 'jsdom';
import { BrowserFake } from 'webextensions-api-fake';

declare global {
  interface GlobalWindow extends jsdom.DOMWindow {
    _mochaTest?: boolean;
    AbortController: any;
  }

  namespace NodeJS {
    interface Global {
      document: Document;
      window: GlobalWindow;
      browser: BrowserFake;
      AbortController: any;
    }
  }
}
