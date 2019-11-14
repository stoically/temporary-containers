import jsdom from 'jsdom';

declare global {
  interface GlobalWindow extends jsdom.DOMWindow {
    _mochaTest?: boolean;
    AbortController: any;
  }

  namespace NodeJS {
    interface Global {
      document: Document;
      window: GlobalWindow;
      browser: any;
      AbortController: any;
    }
  }
}
