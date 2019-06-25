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
* Watcher: `npm run test-watch`


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


## Limitations
* Disabled in "Private Windows" since Firefox doesn't support it
* Android Support is not possible since [Firefox doesn't support it](https://bugzilla.mozilla.org/show_bug.cgi?id=1398097)
* Mouse Clicks:
  * In combination with [Multi-Account Containers](https://github.com/mozilla/multi-account-containers): Opening the same link multiple times in quick succession will probably not work as expected when the site is set to "Always open in $Container".
  * Doesn't work on addons.mozilla.org (Firefox prevents content scripts there). If you assign addons.mozilla.org to "Always open in" with Multi-Account Containers you will see unexpected behavior since Add-ons, including Multi-Account Containers, are not allowed to block requests to addons.mozilla.org.
* In Automatic Mode:
  * "No Container" Tab (Alt+N) and Window (Shift+Alt+C) must open about:blank due to Firefox API limitations and thus the address bar can't get focus when opening a new "No Container" tab.


## License

MIT
