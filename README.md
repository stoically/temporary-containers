# Temporary Containers Firefox Add-on [![Build Status](https://travis-ci.org/stoically/firefox-add-on-temporary-containers.svg?branch=master)](https://travis-ci.org/stoically/firefox-add-on-temporary-containers)

**Open Tabs in new Temporary Containers by**
* Clicking the "Temporary Containers"-Icon
* Pressing the Alt+C Shortcut
* Clicking on "Open Link in New Temporary Container Tab" in the RightClick ContextMenu on a Link
* MiddleMouse Click on a Link*
* Ctrl/Cmd+LeftMouse Click on a Link*
* LeftMouse Click on a Link* (disabled by default)  
  \* Configurable in the Preferences Globally and per Website


**Want to make the most out of Temporary Containers? Enable Automatic Mode!**
The Automatic Mode will overwrite your standard ways of opening Tabs : instead of opening the Tab in No Container, it will open the Tab in a freshly created Temporary Container. If you do so, you should also configure the Global Mouse Clicks to open new Temporary Containers. Recommended settings:
* Middle Mouse: Always
* Ctrl/Cmd+Left Mouse: Always
* Left Mouse: Only if the clicked Link is not the exact same Domain as the Website

**How to stay logged in on some websites in Automatic Mode?**  
You can use the official [Multi-Account Containers Add-on from Mozilla](https://addons.mozilla.org/firefox/addon/multi-account-containers/) to keep data (like cookies) from some websites in permanent containers and with that stay logged in. Then you can easily leave "Automatic Mode" enabled, which is preferable from a privacy-perspective. For a step-by-step guide and some more in-depth informations [you might want to check out out this article](https://medium.com/@stoically/enhance-your-privacy-in-firefox-with-temporary-containers-33925cd6cd21).

Quick Guide:
* Install [Multi-Account Containers](https://addons.mozilla.org/firefox/addon/multi-account-containers/)
* Click on the new toolbar icon and through the initial welcome-cards
* Now you see a list of predefined permanent containers: Personal, Work, Banking, Shopping
* Click on one of the permanent containers to open a new tab in it
* Navigate to the website where you always want to stay logged in
* Click the toolbar icon again and tick the "Always open in" checkbox
* Now every time you navigate to that website it'll open in the permanent container

**Ok, so how does it enhance my privacy?**  
Every new Container isolates all local data that websites create (First- and Third-Party Cookies, localStorage, indexedDB, HTTP data cache, Image Cache and any other areas supported by originAttributes) from each other - that makes it harder to track you and thus enhances your privacy. Also - when the last tab in an automatically created Temporary Container closes it gets deleted - and with it all data that websites created inside that Container. As a bonus it'll strip referer information if you use configured Mouse Clicks to open new Temporary Containers.


**Other Keyboard Shortcuts**
Open Tabs in new "No Container" tabs by
* Pressing Alt+N (Tab) or Shift+Alt+C (Window)
* RightClick ContextMenu on a Link "Open Link in New Container Tab" > "No Container"

Open Tabs in the currently active Container
* Pressing Alt+X

**Automatically Delete History**  
There's a feature that lets you open special Temporary Containers that automatically delete their History. It needs to be explicitly enabled in the options under "Advanced". It comes with a warning since Firefox doesn't support that feature fully yet. Make sure to read it carefully before using that feature.

**Privacy Policy and Permissions**  
Temporary Containers NEVER sends any data to external servers and it DOES NOT track ANYTHING. It only stores some necessary data LOCALLY to provide functionality.

Temporary Containers asks for some permissions upon installation:
* "Access your data for all websites" is needed to provide automatic reopening of websites in Temporary Containers
* "Access browser tabs" is needed to create tabs in Temporary Containers and close tabs that are not in Temporary Containers

[Get the Add-on here.](https://addons.mozilla.org/firefox/addon/temporary-containers/)


## Comparison with other privacy configurations and Add-ons

### Private Windows
If you open “Private Windows” in Firefox, all tabs that you open within Private Windows (even multiple ones)  use the same underlying container and accept first-party and third-party cookies. So if you do your browsing within Private Windows, it can easily be tracked between sites while the windows are open. A way to test that is, just login to a site in one Private Window, open another tab in a new Private Window and open the same site again — you’ll see that you’re still logged in. Of course, if you then close the windows, the container storage is cleared.

### Disabled third-party cookies, maybe even with [First Party Isolation](https://www.ghacks.net/2017/11/22/how-to-enable-first-party-isolation-in-firefox/)
All first-party data will remain on your disk. If you for example open a link to an item on a shopping site in one tab and a little bit later open a link to another item on the same shopping site in another tab — then it’s clear to the site that you saw both items because of cookies/storage. Though in practice some sites might go to the extend to match that visit with [fingerprinting](https://panopticlick.eff.org/about), using Temporary Containers still makes it harder to track you.

### [Cookie AutoDelete](https://addons.mozilla.org/en-US/firefox/addon/cookie-autodelete/) to automatically remove cookies and localStorage
The same as with "Private Windows" and “Disabled third-party cookies” applies as long as the cookie storage isn’t cleared —  which depends on which settings you have in CAD and defaults to manually clicking "Clean". Also with localStorage support enabled you make fingerprinting easier, [because CAD needs to set a cookie for the domains you visit](https://github.com/Cookie-AutoDelete/Cookie-AutoDelete/wiki/Documentation#enable-localstorage-support) and CAD can’t clear [indexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API) storage or [CacheStorage](https://developer.mozilla.org/en-US/docs/Web/API/CacheStorage) at all ([because of Firefox API limitations](https://bugzilla.mozilla.org/show_bug.cgi?id=1340511)). If you want to see it yourself try filling your indexedDB and localStorage with 5kb [on this site](https://demo.agektmr.com/storage/). Now close the tab (and click Clean depending on your settings), open the site again and you’ll see that the indexedDB storage is still there.

It’s still really useful to have Cookie AutoDelete: it can keep your permanent container clean from unwanted Cookies. Make sure to activate the Container Support — and instead of activating localStorage support I’d recommend using Temporary Containers.

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
