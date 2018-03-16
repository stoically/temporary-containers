const fs = require('fs');
const manifestJson = require('./src/manifest.json');
const updateUrl = 'https://raw.githubusercontent.com/stoically/temporary-containers/master/updates.json';
manifestJson.applications.gecko.update_url = updateUrl;

// eslint-disable-next-line quotes
fs.writeFileSync('./src/manifest.json', JSON.stringify(manifestJson, null, 2) + "\n");