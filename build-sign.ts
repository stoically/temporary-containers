import fs from 'fs';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const manifestJson = require('./src/manifest.json');
const updateUrl =
  'https://raw.githubusercontent.com/stoically/temporary-containers/beta-updates/updates.json';
// eslint-disable-next-line @typescript-eslint/camelcase
manifestJson.applications.gecko.update_url = updateUrl;

// eslint-disable-next-line quotes
fs.writeFileSync(
  './src/manifest.json',
  JSON.stringify(manifestJson, null, 2) + '\n'
);
