# Per Domain

`Per Domain Isolation` is basically the same as [`Global Isolation`](Global-Isolation), but the configuration only applies per configured `Domain Pattern`, not for all tabs. It overwrites `Navigating in Tabs` and `Mouse Clicks` from `Global Isolation` if you set the configuration to something else than `Use Global`.

## Domain Pattern

Domain Patterns match the active tabs domain. If you load the URL `https://example.com/moo` in a tab, then the Domain is `example.com`.

Domain Patterns can have the following format:
* *Exact match:* e.g. **`example.com`** or **`www.example.com`**
* *Glob/Wildcard match:* e.g. **`*.example.com`** (all example.com subdomains)
  Note: **`*.example.com`** would not match **`example.com`** so you might need two Per Domain configurations.

#### Advanced
If you configure a Domain Pattern in the format **/pattern/flags** it will be parsed as [Regular Expression](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions) and match the Full URL instead of just the domain.

A RegExp Pattern to e.g. match *`http://example.com/foo`*, *`https://example.com/foo`* and *`https://example.com/foo/bar`* would be: **`/^https?://example\.com/foo/`**


## Always open in new Temporary Container

#### Enabled
Will reopen tabs in a new Temporary Container if:

  * Navigating in a new tab that isn't a Temporary Container to an URL matching the Domain Pattern
  * The active tab URL doesn't match the Domain Pattern and then tries to navigate to an URL that matches the Domain Pattern

#### Allow to load in Permanent Containers
Lets you open URLs matching the Domain Pattern in Permanent Container tabs. In this case tabs will only be reopened when navigating in the Default Container or in Temporary Containers.


## Navigating in Tabs should open new Temporary Containers

#### Use Global
Will use the `Global Isolation` configuration for `Navigating`.

#### Always
Every  in the active tab will reopen in new Temporary Containers.

#### If the  target domain does not exactly match the active tabs domain - Subdomains also get isolated
Will reopen tabs in new Temporary Containers if the active tab tries to navigate to a URL whose domain does not exactly match the active tabs domain. Subdomains do not match exactly and hence get also isolated.

#### If the  target domain does not match the active tabs domain - Subdomains won't get isolated
Will reopen tabs in new Temporary Containers if the active tab tries to navigate to a URL whose domain does not match the active tabs domain. All Subdomains also match and hence won't get isolated.

#### Never
No isolation applies.

### Notes
- [Not every website navigation is actually a browser navigation which can get isolated](Isolation-Notes#navigating-in-tabs-isolation-exceptions)

## Mouse Clicks on links should open new Temporary Containers

`Middle Mouse`, `Ctrl/Cmd+Left Mouse` and `Left Mouse`

#### Use Global
Will use the `Global Isolation` configuration for the respective `Mouse Click`.

#### Always
Every clicked link in the active tab will reopen in new Temporary Containers.

#### If the clicked link domain does not exactly match the active tabs domain - Subdomains also get isolated
Will reopen clicked links in new Temporary Containers if the clicked link is a URL whose domain does not exactly match the active tabs domain. Subdomains do not match exactly and hence get also isolated.

#### If the clicked link Domain does not match the active tabs domain - Subdomains won't get isolated
Will reopen clicked links in new Temporary Containers if the clicked link is a URL whose domain does not match the active tabs domain. All Subdomains also match and hence won't get isolated.

#### Never
No isolation applies.

### Notes
- [Not all Mouse Clicks can get catched](Isolation-Notes#mouse-clicks-exception).
- Navigating in tabs also covers mouse clicks (since it's a navigation), so you might not need to configure mouse clicks, unless you want a more strict configuration for a specific mouse click. Navigating in tabs is also more reliable, so you should prefer that if possible.

## Exclude target domains

Domain Patterns added here will not get isolated if encountered in a  or Mouse Click Isolation. It only applies if the navigation or mouse click originates from the configured Domain Pattern.