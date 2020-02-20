import jsdom from 'jsdom';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { BrowserFake } from 'webextensions-api-fake';

declare global {
  interface GlobalWindow extends jsdom.DOMWindow {
    _mochaTest?: boolean;
  }

  namespace NodeJS {
    interface Global {
      document: Document;
      window: GlobalWindow;
      browser: BrowserFake;
      AbortController: {
        new (): AbortController;
        prototype: AbortController;
      };
    }
  }
}
