# Per Domain

`Per Domain Isolation` is basically the same as [`Global Isolation`](Global-Isolation), but the configuration only applies per configured `Domain Pattern`, not for all tabs. It overwrites `Navigating in Tabs` and `Mouse Clicks` from `Global Isolation` if you set the configuration to something else than `Use Global`.

## Domain Pattern

Domain Patterns match the active Tabs Domain. If you load the URL `https://example.com/moo` in a Tab, then the Domain is `example.com`.

Domain Patterns can have the following format:
* *Exact match:* e.g. **`example.com`** or **`www.example.com`**
* *Glob/Wildcard match:* e.g. **`*.example.com`** (all example.com subdomains)
  Note: **`*.example.com`** would not match **`example.com`** so you might need two Per Domain configurations.

#### Advanced
If you configure a Domain Pattern in the format **/pattern/flags** it will be parsed as [Regular Expression](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions) and match the Full URL instead of just the Domain.

A RegExp Pattern to e.g. match *`http://example.com/foo`*, *`https://example.com/foo`* and *`https://example.com/foo/bar`* would be: **`/^https?://example\.com/foo/`**


## Always open in new Temporary Container

#### Enabled
Will reopen Tabs in a new Temporary Container if:

  * Navigating in a new Tab that isn't a Temporary Container to an URL matching the Domain Pattern
  * The active Tab URL doesn't match the Domain Pattern and then tries to navigate to an URL that matches the Domain Pattern

#### Allow to load in Permanent Containers
Lets you open URLs matching the Domain Pattern in Permanent Container Tabs. In this case Tabs will only be reopened when navigating in the Default Container or in Temporary Containers.


## Navigating in Tabs should open new Temporary Containers

#### Use Global
Will use the `Global Isolation` configuration for `Navigating`.

#### Always
Every Navigation in the active Tab will reopen in new Temporary Containers.

#### If the Navigation Target Domain does not exactly match the active Tabs Domain - Subdomains also get isolated
Will reopen Tabs in new Temporary Containers if the active Tab tries to navigate to a URL whose Domain does not exactly match the active Tabs Domain. Subdomains do not match exactly and hence get also isolated.

#### If the Navigation Target Domain does not match the active Tabs Domain - Subdomains won't get isolated
Will reopen Tabs in new Temporary Containers if the active Tab tries to navigate to a URL whose Domain does not match the active Tabs Domain. All Subdomains also match and hence won't get isolated.

#### Never
No isolation applies.

### Notes
- [Not every website navigation is actually a browser navigation which can get isolated](Isolation-Notes#navigating-in-tabs-isolation-exceptions)

## Mouse Clicks on Links should open new Temporary Containers

`Middle Mouse`, `Ctrl/Cmd+Left Mouse` and `Left Mouse`

#### Use Global
Will use the `Global Isolation` configuration for the respective `Mouse Click`.

#### Always
Every clicked Link in the active Tab will reopen in new Temporary Containers.

#### If the clicked Link Domain does not exactly match the active Tabs Domain - Subdomains also get isolated
Will reopen clicked Links in new Temporary Containers if the clicked Link is a URL whose Domain does not exactly match the active Tabs Domain. Subdomains do not match exactly and hence get also isolated.

#### If the clicked Link Domain does not match the active Tabs Domain - Subdomains won't get isolated
Will reopen clicked Links in new Temporary Containers if the clicked Link is a URL whose Domain does not match the active Tabs Domain. All Subdomains also match and hence won't get isolated.

#### Never
No isolation applies.

### Notes
- [Not all Mouse Clicks can get catched](Isolation-Notes#mouse-clicks-exception).
- Navigating in tabs also covers mouse clicks (since it's a navigation), so you might not need to configure mouse clicks, unless you want a more strict configuration for a specific mouse click. Navigating in tabs is also more reliable, so you should prefer that if possible.

## Exclude target domains

Domain Patterns added here will not get isolated if encountered in a Navigation or Mouse Click Isolation. It only applies if the navigation or mouse click originates from the configured Domain Pattern.