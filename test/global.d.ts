import { Log } from '~/background/log';

declare global {
  namespace NodeJS {
    interface Global {
      window: {
        _mochaTest?: boolean;
        log?: Log;
        setTimeout: typeof setTimeout;
      };
      browser: any;
      AbortController: any;
    }
  }
}
