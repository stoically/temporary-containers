# Temporary Containers Firefox Add-on [![Build Status](https://travis-ci.org/stoically/firefox-add-on-temporary-containers.svg?branch=master)](https://travis-ci.org/stoically/firefox-add-on-temporary-containers)

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

[Get the Add-on here.](https://addons.mozilla.org/firefox/addon/temporary-containers/)

## Notes
If you have any Suggestions, Feedback or BugReports please make sure to leave me an Issue here on GitHub.

Works together with [Multi-Account Containers](https://github.com/mozilla/multi-account-containers).

The automatically created Temporary Containers get removed 0.5 seconds after the Last Tab in a given Temporary Container closes. Sometimes removing the Temporary Container doesn't work immediately - but don't worry, not needed Temporary Containers will automatically get removed eventually!

[Learn more about Containers](https://addons.mozilla.org/firefox/addon/multi-account-containers/)


## Limitations
* Disabled in "Private Windows" since Firefox doesn't support it
* Android Support is not possible since [Firefox doesn't support it](https://bugzilla.mozilla.org/show_bug.cgi?id=1398097)
* Mouse Clicks:
  * In Combination with [Multi-Account Containers](https://github.com/mozilla/multi-account-containers): Opening the same link multiple times in quick succession when it's set to "Always open in $Container" will probably not work as expected.
  * Doesn't work on addons.mozilla.org (Firefox prevents content scripts there)
* In Automatic Mode:
  * Opening a "New Window" or starting Firefox, only opens a Temporary Container if you <strong>don't</strong> set the Preference "When Firefox starts" to "Show a blank page". Although as soon as you start navigating to a http(s) Website it will convert the Tab to a Temporary Container one.
  * "No Container" Alt+N (Tab) and Shift+Alt+C (Window) must open about:blank due to Firefox API limitations and thus the addressbar can't get focus when opening a new "No Container" Tab
* With the Firefox Preference "Show your windows and tabs from last time" active, if you have multiple Windows and want the Tabs to correctly restore in its Temporary Container, you have to close the windows in a certain way:
  * Multiple normal and/or private windows: You have to close using the Browser Menu and then click "Quit"
  * One normal window and a private window: Either use the Browser Menu and click "Quit" (private windows don't get restored from Firefox) or *first* close the Private Window and *then* the normal window.


## Privacy
There's a discussion about [Moving between containers](https://github.com/mozilla/multi-account-containers/wiki/Moving-between-containers) and I think that this Add-on enhances privacy by providing Temporary/Throw-away/Disposable Containers whenever possible, while not breaking normal navigation or e.g. OAuth redirects on a given Website.


## Libraries
The included [SemanticUI](https://semantic-ui.com/) and its dependency [jQuery](https://jquery.com/) are **only** used to style the Preferences/Options Page.


## License

MIT
