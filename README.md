# Temporary Containers Firefox Add-on [![Build Status](https://travis-ci.org/stoically/temporary-containers.svg?branch=master)](https://travis-ci.org/stoically/temporary-containers) [![Coverage Status](https://coveralls.io/repos/github/stoically/temporary-containers/badge.svg?branch=master)](https://coveralls.io/github/stoically/temporary-containers?branch=master)

Detailed information about the Add-on [can be found on AMO](https://addons.mozilla.org/firefox/addon/temporary-containers/). There's also [this long-form article](https://medium.com/@stoically/enhance-your-privacy-in-firefox-with-temporary-containers-33925cd6cd21) and the [project wiki](https://github.com/stoically/temporary-containers/wiki).

## Development

### Requirements

* Clone the repository
* `npm install`
* `npm run watch`

### Run in Firefox

* `npm install -g web-ext`
* `web-ext run -s dist`
    * starts the default system Firefox, loads the Add-on and watches for changes
    * append `-p profilename` to start Firefox with a different profile

or

* Open `about:debugging` and `Load Temporary Add-on` which is located in the `dist` directory


Check `about:debugging` and click `Debug` under Temporary Container to see the console.


### Run the tests

* Once: `npm test` - this also shows a coverage summary and generates a detailed report in the `coverage` directory
* Watcher: `npm run test:watch`


### Release

#### AMO and GitHub

* Bump manifest version
* `npm run build`
* Upload zip web-ext-artifact to AMO
* Download published AMO xpi
* Create and publish GitHub release with AMO xpi
* Add new version with link to the GitHub xpi to `updates.json`
* Commit and push


#### Pre-Release on GitHub

* Set API key/secret env vars
* Bump manifest version as beta
* Commit
* `npm run build-sign` (Adds `update_url` to manifest and reverts with `git checkout -- manifest.json`)
* Create and publish GitHub pre-release with generated xpi web-ext-artifact
* Add new version with link to GitHub xpi to `updates.json`
* Commit and push



## Libraries
[Vue.js](https://vuejs.org) and [SemanticUI](https://semantic-ui.com/) are used for the preferences & popup UI.


## License

MIT
