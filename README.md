# Temporary Containers Firefox Add-on [![Build Status](https://travis-ci.org/stoically/firefox-add-on-temporary-containers.svg?branch=master)](https://travis-ci.org/stoically/firefox-add-on-temporary-containers)

Wondering what Containers or Temporary Containers are? [Here's an article explaining it](https://medium.com/@stoically/enhance-your-privacy-in-firefox-with-temporary-containers-33925cd6cd21).

Open Tabs in new Temporary Containers when:
* Clicking the "Temporary Containers"-Icon
* Pressing the Alt+C Shortcut
* Clicking on "Open Link in New Temporary Container Tab" in the RightClick ContextMenu on a Link
* MiddleMouse Click on a Link*
* Ctrl/Cmd+LeftMouse Click on a Link*  
  \* Configurable in the Preferences Globally and per Website

With "Automatic Mode" active (default):
* Clicking the "New Tab"-Icon
* Clicking "New Tab" or "New Window" in the Browser Menu
* Pressing the Ctrl+T or Ctrl+N Shortcut
* An external Program opens a Link in the Browser

Never open Tabs in new Temporary Containers when:
* Regular click on a Link on a Website
* Website redirects or opens new Tab itself
* Clicking "Open Link in New $Container Tab" in the RightClick ContextMenu on a Link

Open Tabs in "No Container":
* Pressing Alt+N (Tab) or Shift+Alt+C (Window)
* RightClick ContextMenu on a Link "Open Link in New Container Tab" > "No Container"

Open Tabs in the current active Container:
* Pressing Alt+X

There's an Advanced configuration to activate automatic deletion of History for Temporary Containers. It comes with a Warning since Firefox doesn't support that feature fully yet. Make sure to read it carefully before using that feature.

[Get the Add-on here.](https://addons.mozilla.org/firefox/addon/temporary-containers/)

## Notes
If you have any Suggestions, Feedback or BugReports please make sure to leave me an Issue here on GitHub.

The automatically created Temporary Containers get removed 0.5 seconds after the Last Tab in a given Temporary Container closes. Sometimes removing the Temporary Container doesn't work immediately - but don't worry, not needed Temporary Containers will automatically get removed eventually!


## Comparison with other privacy configurations and Add-ons

### Private Windows
If you open “Private Windows” in Firefox, all tabs that you open within that Private Windows use the same underlying container and accept first-party and third-party cookies. So if you do your browsing within that Private Window, it can easily be tracked between sites while the window is open. A way to test that is, just login to a site, open another tab and open the same site again — you’ll see that you’re still logged in. Of course, if you then close the window, the container storage is cleared.

### Disabled third-party cookies, maybe even with [First Party Isolation](https://www.ghacks.net/2017/11/22/how-to-enable-first-party-isolation-in-firefox/)
All first-party data will remain on your disk. If you for example open a link to an item on a shopping site in one tab and a little bit later open a link to another item on the same shopping site in another tab — then it’s clear to the site that you saw both items because of cookies/storage. Though in practice some sites might go to the extend to match that visit with [fingerprinting](https://panopticlick.eff.org/about), using Temporary Containers still makes it harder to track you.

### [Cookie AutoDelete](https://addons.mozilla.org/en-US/firefox/addon/cookie-autodelete/) to automatically remove cookies and localStorage
The same as with “Disabled third-party cookies” applies as long as the cookie storage isn’t cleared — which depends on which settings you have in CAD. Also with localStorage support enabled you make fingerprinting easier, [because CAD needs to set a cookie for the domains you visit](https://github.com/Cookie-AutoDelete/Cookie-AutoDelete/wiki/Documentation#enable-localstorage-support) and CAD can’t clear [indexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API) storage or [CacheStorage](https://developer.mozilla.org/en-US/docs/Web/API/CacheStorage) at all ([because of Firefox API limitations](https://bugzilla.mozilla.org/show_bug.cgi?id=1340511)). If you want to see it yourself try filling your indexedDB and localStorage with 5kb [on this site](https://demo.agektmr.com/storage/). Now close the tab (and click Clean depending on your settings), open the site again and you’ll see that the indexedDB storage is still there.

It’s still really useful to have Cookie AutoDelete: it can keep your permanent container clean from unwantend Cookies. Make sure to activate the Container Support — and instead of activating localStorage support I’d recommend using Temporary Containers.

### Containers on the Go
Has only the basic feature of opening disposable containers with Toolbar Icon, Keyboard Shortcut and Context Menu. None of the other mentioned features that Temporary Containers has. Also it’s Proprietary Software.


## Recommended privacy enhancing Add-ons

### [Multi-Account Containers](https://github.com/mozilla/multi-account-containers)
Provides you configuration and management of permanent containers. Including a way to always open certain sites in a permanent container.

### [Decentraleyes](https://addons.mozilla.org/firefox/addon/decentraleyes/)
Protects you against tracking through “free”, centralized, content delivery by automatically injecting local resources if possible.

### [Don’t track me google](https://addons.mozilla.org/firefox/addon/dont-track-me-google1/)
If your search-engine of choice happens to be Google this Add-on will remove the tracking automatically placed on result-links. Or just use [startpage.com](https://www.startpage.com/) instead.

### [HTTPS Everywhere](https://addons.mozilla.org/firefox/addon/https-everywhere)
Automatically redirects you to the secure version of websites if available.

### [uBlock Origin](https://addons.mozilla.org/firefox/addon/ublock-origin/)
I guess you already know this one. If not, check it out.


## Privacy

**Temporary Containers NEVER sends any data to external servers and it DOES NOT track ANYTHING. It only stores some necessary data LOCALLY to provide functionality.**

Temporary Containers asks for some permissions upon installation:
* "Access your data for all websites" is needed to provide automatic reopening of websites in Temporary Containers
* "Access browser tabs" is needed to create tabs in Temporary Containers and close tabs that are not in Temporary Containers

There's a discussion about [Moving between containers](https://github.com/mozilla/multi-account-containers/wiki/Moving-between-containers) and I think that this Add-on enhances privacy by providing Temporary/Throw-away/Disposable Containers whenever possible, while not breaking normal navigation or e.g. OAuth redirects on a given Website.


## Libraries
The included [SemanticUI](https://semantic-ui.com/) and its dependency [jQuery](https://jquery.com/) are **only** used to style the Preferences/Options Page.


## Limitations
* Disabled in "Private Windows" since Firefox doesn't support it
* Android Support is not possible since [Firefox doesn't support it](https://bugzilla.mozilla.org/show_bug.cgi?id=1398097)
* Mouse Clicks:
  * In Combination with [Multi-Account Containers](https://github.com/mozilla/multi-account-containers): Opening the same link multiple times in quick succession when it's set to "Always open in $Container" will probably not work as expected.
  * Doesn't work on addons.mozilla.org (Firefox prevents content scripts there). If you assign addons.mozilla.org to "Always open in" with Multi-Account Containers you will see unexpected behavior since Add-ons, including Multi-Account Containers, are not allowed to block requests to addons.mozilla.org.
* In Automatic Mode:
  * Opening a "New Window" or starting Firefox, only opens a Temporary Container if you <strong>don't</strong> set the Preference "When Firefox starts" to "Show a blank page". Although as soon as you start navigating to a http(s) Website it will convert the Tab to a Temporary Container one.
  * "No Container" Alt+N (Tab) and Shift+Alt+C (Window) must open about:blank due to Firefox API limitations and thus the addressbar can't get focus when opening a new "No Container" Tab


## Development

### Requirements

* Clone the repository
* `npm install`
* `npm install -g web-ext`

### Run in Firefox

* `npm run dev-webpack`
  * webpack watcher
* `web-ext run`
  * starts the default system Firefox, loads the Add-on and watches for changes
  * append `-p profilename` to start Firefox with a different profile
  * check `about:debugging` and click `Debug` under Temporary Container to see the console

### Running the tests

* Once: `npm test`
* Watcher: `npm run test-watch`


## License

MIT
