# Global

Isolation lets you configure cases where navigating in tabs or mouse clicks on links should open new Temporary Containers instead of just navigating to the target domain, hence isolating the origin domain.

## Navigating in Tabs should open new Temporary Containers

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
- Navigating in tabs also covers mouse clicks (since it's a navigation), so you might not need to configure mouse clicks, unless you want a more strict configuration for a specific mouse click. Navigating in tabs is also more reliable, so you should prefer that if possible.

## Mouse Clicks on links should open new Temporary Containers

`Middle Mouse`, `Ctrl/Cmd+Left Mouse` and `Left Mouse`

#### Always
Every clicked link in the active tab will reopen in new Temporary Containers.

#### If the clicked link domain does not exactly match the active tabs domain - Subdomains also get isolated
Will reopen clicked links in new Temporary Containers if the clicked link is a URL whose domain does not exactly match the active tabs domain. Subdomains do not match exactly and hence get also isolated.

#### If the clicked link domain does not match the active tabs domain - Subdomains won't get isolated
Will reopen clicked links in new Temporary Containers if the clicked link is a URL whose domain does not match the active tabs domain. All Subdomains also match and hence won't get isolated.

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
- `Navigating in Tabs` and `Mouse Clicks` in `Global Isolation` apply to all tabs unless overwritten by a specific [`Per Domain Isolation`](Per-Domain-Isolation) configuration. `Exclude permanent containers` and `Exclude domains` can't get overwritten.