# Limitations

* Disabled in "Private Windows" since Firefox doesn't support it
* Android Support is not possible since [Firefox doesn't support it](https://bugzilla.mozilla.org/show_bug.cgi?id=1398097)
* Mouse Click:
  * In combination with [Multi-Account Containers](https://github.com/mozilla/multi-account-containers): Opening the same link multiple times in quick succession will probably not work as expected when the site is set to "Always open in $Container".
  * Doesn't work on addons.mozilla.org (Firefox prevents content scripts there). If you assign addons.mozilla.org to "Always open in" with Multi-Account Containers you will see unexpected behavior since Add-ons, including Multi-Account Containers, are not allowed to block requests to addons.mozilla.org.
* In Automatic Mode:
  * "No Container" tab (Alt+N) and Window (Shift+Alt+C) must open about:blank due to Firefox API limitations and thus the address bar can't get focus when opening a new "No Container" tab.