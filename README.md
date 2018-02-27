# Temporary Containers Firefox Add-on [![Build Status](https://travis-ci.org/stoically/firefox-add-on-temporary-containers.svg?branch=master)](https://travis-ci.org/stoically/firefox-add-on-temporary-containers)

Detailed informations about the [Add-on can be found on AMO](https://addons.mozilla.org/firefox/addon/temporary-containers/). There's also this long-read [article](https://medium.com/@stoically/enhance-your-privacy-in-firefox-with-temporary-containers-33925cd6cd21) and some informations are available in the [Wiki](https://github.com/stoically/firefox-add-on-temporary-containers/wiki) (which you can edit, if you'd want).

## Development

### Requirements

* Clone the repository
* `npm install`
* `npm install -g web-ext`

### Run in Firefox

1. `npm run dev-webpack`
    * webpack watcher

2. `web-ext run -s build`
    * starts the default system Firefox, loads the Add-on and watches for changes
    * append `-p profilename` to start Firefox with a different profile
    * check `about:debugging` and click `Debug` under Temporary Container to see the console

### Run the tests

* Once: `npm test`
* Watcher: `npm run test-watch`


## Libraries
The included [SemanticUI](https://semantic-ui.com/) and its dependency [jQuery](https://jquery.com/) are **only** used for the preferences&popup UI, not for the background and contentscript.


## Limitations
* Disabled in "Private Windows" since Firefox doesn't support it
* Android Support is not possible since [Firefox doesn't support it](https://bugzilla.mozilla.org/show_bug.cgi?id=1398097)
* Mouse Clicks:
  * In Combination with [Multi-Account Containers](https://github.com/mozilla/multi-account-containers): Opening the same link multiple times in quick succession when it's set to "Always open in $Container" will probably not work as expected.
  * Doesn't work on addons.mozilla.org (Firefox prevents content scripts there). If you assign addons.mozilla.org to "Always open in" with Multi-Account Containers you will see unexpected behavior since Add-ons, including Multi-Account Containers, are not allowed to block requests to addons.mozilla.org.
* In Automatic Mode:
  * "No Container" Alt+N (Tab) and Shift+Alt+C (Window) must open about:blank due to Firefox API limitations and thus the addressbar can't get focus when opening a new "No Container" Tab


## License

MIT
