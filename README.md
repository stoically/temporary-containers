# Temporary Containers Firefox Add-on

Automatically open Tabs in new Temporary Containers when:
* Pressing the Ctrl+T Shortcut
* Clicking the "New Tab" Symbol (+)
* Clicking "New Tab" in the Browser Menu
* MiddleMouse Click on a Link on a Website
* Ctrl+LeftMouseClick on a Link on a Website

Doesn't open Tabs in new Temporary Containers when:
* Regular click on a Link on a Website
* Website redirects or opens new Tab itself
* Clicking "New Tab" in the RightClick ContextMenu on a Link on a Website
* Pressing Shift+LeftMouseClick on a Link on a Website

## Notes

There's a discussion about [Moving between containers](https://github.com/mozilla/multi-account-containers/wiki/Moving-between-containers) and I think
that this Extension enhances privacy by providing Temporary/Throw-away Containers whenever possible, while not breaking
navigation (or e.g. OAuth redirects) on a given Website as long as the user just LeftMouseClicks (or chooses on of the other ways that don't open a new Temporary Container).

Works together with [Multi-Account Containers](https://github.com/mozilla/multi-account-containers).

The automatically created Containers get removed after the Last Tab in that Container closes.


## License

MIT
