# Overview

Want to make the most out of Temporary Containers? Enable Automatic Mode!
The Automatic Mode will overwrite your standard ways of opening new tabs - even when opened from an external program. Instead of opening tabs in No Container, it will open them in a freshly created Temporary Container. No more cookie, cache and storage collecting in one place, everything happens in its own isolated Temporary Container. If you enable Automatic Mode, you should also configure Mouse Click to open new Temporary Containers. Recommended preferences:

Isolation > Global > Mouse Click
- Middle Mouse: Always

Automatically reopen tabs in new Temporary Containers when
* Opening a new tab
* A tab tries to load a link in the Default Container
* An external Program opens a link in the Browser

In combination with [Multi-Account Containers](https://addons.mozilla.org/firefox/addon/multi-account-containers/)
* Reopens Confirm Page if in Default Container so you can choose between Temporary Container and Permanent Container

*Note:*
- If you experience a huge delay when new tabs are reopened, maybe even losing typed characters in the address bar, you can change the *Automatic Mode* configuration in the *Advanced* section to `Don't reopen [..] but instead on navigation`.