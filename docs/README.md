Easily open disposable containers that isolate attached data and are deleted after usage: Fully automatic, based on navigation-target, for certain websites, with configured mouse clicks on links or just by using the toolbar icon.

**Want to make the most out of Temporary Containers? Enable Automatic Mode!**
The Automatic Mode will overwrite your standard ways of opening new tabs - even when opened from an external program. Instead of opening tabs in No Container, it will open them in a freshly created Temporary Container. No more cookie, cache and storage collecting in one place, everything happens in its own isolated Temporary Container. If you enable Automatic Mode, you should also configure Mouse Clicks to open new Temporary Containers. Recommended preferences:

*Isolation > Global > Mouse Clicks*

- Middle Mouse: Always


**How does it enhance my privacy?**
Every new Container [isolates local data that websites create](https://wiki.mozilla.org/Security/Contextual_Identity_Project/Containers#What_is_.28and_isn.27t.29_separated_between_Containers) (First- and Third-Party Cookies, localStorage, indexedDB, HTTP data cache, Image Cache and any other areas supported by originAttributes - except HSTS and OCSP) from each other - that makes it harder to track you and thus enhances your privacy. Also - when the last tab in an automatically created Temporary Container closes it gets deleted (after 15minutes by default, so you can Undo Close Tabs in that timeframe) - and with it all data that websites created inside that Container. As a bonus it'll strip referer information if you use configured Websites, Isolation or Mouse Clicks to open new Temporary Containers. Besides enhancing privacy containers also do something for security. They help preventing CSRF, clickjacking, or other attacks which rely on the presence of ambient credentials. For more details and comparisons with other privacy enhancing methods check the bottom of this description.


**Open Tabs in new Temporary Containers**

- Automatically in "Automatic Mode"
- Isolation:
  - Configuring per Domain
  - MiddleMouse Click on a Link*
  - Ctrl/Cmd+LeftMouse Click on a Link*
  - LeftMouse Click on a Link*
  - Configuring based on Navigation Target*
- Clicking the "Temporary Containers"-Icon
- Clicking on "Open Link in New Temporary Container Tab" in the ContextMenu of a Link
- Pressing the Alt+C Shortcut

* Configurable in the Preferences Globally and Per Domain (disabled by default)

*Notes: Isolation wont work on or to addons.mozilla.org. Firefox prevents content scripts on and canceling requests to that domain.*

**Other Keyboard Shortcuts**
*Open Tabs in the currently active Container by*

- Pressing Alt+X*
- It's also possible to Middle Mouse or Ctrl/Cmd+Left Click on the default new tab icon


*Open Tabs in new "No Container" Tabs (might be useful in Automatic Mode)*

- Pressing Alt+N* (Tab) or Shift+Alt+C* (Window)
- It's also possible to RightClick ContextMenu on a Link "Open Link in New Container Tab" > "No Container"


* Disabled by default. Need to be activated in the Advanced Add-on options.


**Automatically Delete History**
There's a feature that lets you open special Temporary Containers that automatically delete their History. It needs to be explicitly enabled in the options under "Advanced". It comes with a warning since Firefox doesn't support that feature fully [yet](https://bugzilla.mozilla.org/show_bug.cgi?id=1283320): Every Full Website URL that you visit (including path) will get completely removed from history, since it's not possible to get only the History for one Container yet. Make sure to read the warning and explanation carefully before using that feature.


**Set Cookies**
Sometimes you might want to set and send a specific cookie even when browsing in a Temporary Container. The advanced Set Cookies feature lets you configure on which websites cookies should be set. Setting cookies can make you easier fingerprintable. Especially when they contain user/session-specific data. Avoid setting cookies if you can.


**Privacy Policy and Permissions**
Temporary Containers NEVER sends any data to external servers and it does not track anything. It only stores necessary data LOCALLY to provide functionality.

Temporary Containers asks for [permissions](https://developer.mozilla.org/en-US/Add-ons/WebExtensions/manifest.json/permissions) upon installation:

- **"Access your data for all websites":** Required to provide automatic reopening of websites in Temporary Containers. In order to do that, it is necessary to be able to intercept and potentially cancel every request inside the browser. This is the [**all_urls**](https://developer.mozilla.org/en-US/Add-ons/WebExtensions/Match_patterns#%3Call_urls%3E) permission in combination with the [webRequest and webRequestBlocking](https://developer.mozilla.org/en-US/Add-ons/WebExtensions/API/webRequest) permissions.
- **"Access browser tabs"** Required to access the tabs URL, which is also needed to provide automatic reopening of Websites in Temporary Containers in cases where the currently loaded URL in the tab is relevant to decide whether to stay in a container or open a new one. This is the [**tabs**](https://developer.mozilla.org/en-US/Add-ons/WebExtensions/API/tabs) permission.
- **"Monitor extension usage and manage themes":** Required to provide automatic interoperability with other Container Add-ons like Multi-Account Containers, Facebook Container and Containerise. This is the [**management**](https://developer.mozilla.org/en-US/Add-ons/WebExtensions/API/management) permission.

More required permissions included in the Add-on that don't show up as special text when installing the Add-on are:

- **[contextMenus](https://developer.mozilla.org/en-US/Add-ons/WebExtensions/API/contextMenus)** Required to add the context menu entry when right clicking links.
- **[contextualIdentities](https://developer.mozilla.org/en-US/Add-ons/WebExtensions/API/contextualIdentities)** Required to use the container feature itself, which is natively available in Firefox with this permission.
- **[cookies](https://developer.mozilla.org/en-US/Add-ons/WebExtensions/API/cookies)** Required to [manage tabs based on the "cookieStoreId"](https://developer.mozilla.org/en-US/Add-ons/WebExtensions/API/tabs/query), which is the internal way of handling tabs in combination with the container feature.
- **[storage](https://developer.mozilla.org/en-US/Add-ons/WebExtensions/API/storage)** Required to store and read preferences/options and data needed to provide functionality.


[You can find tips for assessing the safety of an extension here](https://support.mozilla.org/en-US/kb/tips-assessing-safety-extension) and [more general explanation about permission requests here](https://support.mozilla.org/en-US/kb/permission-request-messages-firefox-extensions).


**Free Software / Open Source**
Temporary Containers is Free Software / OpenSource published under the [MIT License](https://github.com/stoically/temporary-containers/blob/master/LICENSE) - so you could check the source or contribute on [GitHub](https://github.com/stoically/temporary-containers), if you'd like. If you want an easy way of taking a look into the source that actually is installed when clicking the "Add to Firefox" button, you can use the excellent [Extension source viewer](https://addons.mozilla.org/en-US/firefox/addon/crxviewer/) Add-on.


**Support and Feedback**
If you have any Suggestions, Feedback or Bugs please make sure to [file an Issue on GitHub](https://github.com/stoically/temporary-containers/issues).


**Troubleshooting**
If "Firefox will: Never remember history" in the Firefox Preferences/Options under "Privacy & Security > History" is selected or you're in a Private Window, then Temporary Containers will not work, since Containers aren't available in Private Windows. Also make sure that you can see a grayed out but ticked Checkbox with the description "Enable Container Tabs" in the Firefox Preferences/Options under "Tabs" after installing. You might need to reinstall Temporary Containers or refresh your Firefox profile if you can't see the ticked Checkbox there.


**Compatibility with other Add-ons**

- [Foxy Gestures User Scripts to open new Temporary Containers](https://github.com/stoically/temporary-containers/wiki/Foxy-Gestures-User-Scripts)



**Complementing Add-ons**

- **[I don't care about cookies:](https://addons.mozilla.org/firefox/addon/i-dont-care-about-cookies/)** If you browse in Automatic Mode and are tired of seeing Cookie and Privacy reminders all over the place, this Add-on is for you. It removes almost all of them!
- **[Switch Container Plus](https://addons.mozilla.org/firefox/addon/switch-container-plus):** Allows to switch the current tab to a different container using a toolbar icon popup.*

* There are security concerns involved when changing a tab between containers. Before installing, please [read this article on the matter](https://github.com/mozilla/testpilot-containers/wiki/Moving-between-containers).


**Recommended privacy enhancing Add-ons**

- **[Decentraleyes](https://addons.mozilla.org/firefox/addon/decentraleyes/):**  Protects you against tracking through “free”, centralized, content delivery by automatically injecting local resources if possible.
- **[Don’t track me google ](https://addons.mozilla.org/firefox/addon/dont-track-me-google1/):** If your search-engine of choice happens to be Google this Add-on will remove the tracking automatically placed on result-links. Or just use [startpage.com](https://www.startpage.com) instead.
- **[HTTPS Everywhere](https://addons.mozilla.org/firefox/addon/https-everywhere):**  Automatically redirects you to the secure version of websites if available.
- **[Request Control:](https://addons.mozilla.org/firefox/addon/requestcontrol/)** Lets you filter session, ref, utm and more query parameters from URLs and can also circumvent outgoing trackers on websites
- **[Skip Redirect](https://addons.mozilla.org/firefox/addon/skip-redirect/):** Automatically skip redirects if possible
- **[uBlock Origin](https://addons.mozilla.org/firefox/addon/ublock-origin/):**  I guess you already know this one. If not, check it out.


You might also want to check out **[github.com/ghacksuserjs/ghacks-user.js](https://github.com/ghacksuserjs/ghacks-user.js)**, which has comprehensive informations regarding [Firefox configurations](https://github.com/ghacksuserjs/ghacks-user.js/wiki/1.1-Overview) and [a list of Add-ons](https://github.com/ghacksuserjs/ghacks-user.js/wiki/4.1-Extensions).

**Comparison with other privacy configurations and Add-ons**

- **Private Windows:** If you open “Private Windows” in Firefox, all tabs that you open within Private Windows (even multiple ones)  use the same underlying container and accept first-party and third-party cookies. So if you do your browsing within Private Windows, it can easily be tracked between sites while the windows are open. A way to test that is, just login to a site in one Private Window, open another tab in a new Private Window and open the same site again — you’ll see that you’re still logged in. Of course, if you then close the windows, the container storage is cleared.

- **Disabled third-party cookies, maybe even with [First Party Isolation](https://www.ghacks.net/2017/11/22/how-to-enable-first-party-isolation-in-firefox/):** All first-party data will remain on your disk. If you for example open a link to an item on a shopping site in one tab and a little bit later open a link to another item on the same shopping site in another tab — then it’s clear to the site that you saw both items because of cookies/storage. If you're interested in a deep-dive into comparison with FPI or even want to participate in the discussion, then [you can here](https://github.com/ghacksuserjs/ghacks-user.js/issues/395).

- **[Cookies AutoDelete](https://addons.mozilla.org/en-US/firefox/addon/cookie-autodelete/) to automatically remove cookies and localStorage:** The same as with "Private Windows" and “Disabled third-party cookies” applies as long as the cookie storage isn’t cleared — which depends on which settings you have in CAD and defaults to manually clicking "Clean". Also with localStorage support enabled you make fingerprinting easier, [because CAD needs to set a cookie for the domains you visit](https://github.com/Cookie-AutoDelete/Cookie-AutoDelete/wiki/Documentation#enable-localstorage-support) and CAD can’t clear indexebDB storage or CacheStorage at all (because of Firefox API limitations). If you want to see it yourself try filling your indexedDB and localStorage with 5kb [on this site](https://demo.agektmr.com/storage/). Now close the tab (and click Clean depending on your settings), open the site again and you’ll see that the indexedDB storage is still there. It’s still pretty useful to use Cookies AutoDelete: it can keep your permanent container clean from unwanted Cookies. Make sure to activate the Container Support — and instead of activating localStorage support I’d recommend using Temporary Containers.

- **Different profiles or even Virtual Machines:** The same as with "Private Windows" and “Disabled third-party cookies” applies. However, different profiles / VMs of course greatly increase security because storage-wise everything is totally separated and thus also stronger isolated. But that doesn't apply to per Tab or per Domain basis.


So, whether you use First-Party Isolation, Cookie Cleaners, different Profiles or VMs - Containers can give you an easy to handle layer of isolation, privacy and security on top. That being said, please keep in mind that none of that makes you untrackable, because of [Browser fingerprinting](https://github.com/stoically/temporary-containers/wiki/Browser-fingerprinting).