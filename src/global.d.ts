import { TemporaryContainers } from './background';
import { Log } from './background/log';

declare global {
  interface Window {
    tmp?: TemporaryContainers;
    log: Log;
    _mochaTest?: boolean;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    debug: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    migrationLegacy: any;
  }
}
