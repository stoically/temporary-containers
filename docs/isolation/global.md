# Global

Isolation lets you configure cases where navigating in tabs or mouse clicks on links should open new Temporary Containers instead of just navigating to the target domain, hence isolating the origin domain.

## Navigating in Tabs should open new Temporary Containers

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
- Navigating in tabs also covers mouse clicks (since it's a navigation), so you might not need to configure mouse clicks, unless you want a more strict configuration for a specific mouse click. Navigating in tabs is also more reliable, so you should prefer that if possible.

## Mouse Clicks on Links should open new Temporary Containers

`Middle Mouse`, `Ctrl/Cmd+Left Mouse` and `Left Mouse`

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

## Exclude permanent containers from Isolation

Permanent containers added here are excluded from Isolation.

## Exclude domains from Isolation

[Domain Patterns](https://github.com/stoically/temporary-containers/wiki/Per-Domain-Isolation#domain-pattern) added here are excluded from Isolation.

---

### General Notes
- `Navigating in Tabs` and `Mouse Clicks` in `Global Isolation` apply to all Tabs unless overwritten by a specific [`Per Domain Isolation`](Per-Domain-Isolation) configuration. `Exclude permanent containers` and `Exclude domains` can't get overwritten.