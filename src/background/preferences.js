class Preferences {
  constructor(background) {
    this.background = background;
  }

  initialize() {
    this.storage = this.background.storage;
    this.permissions = this.background.permissions;
    this.contextmenu = this.background.contextmenu;
    this.browseraction = this.background.browseraction;
  }

  async handleChanges({oldPreferences, newPreferences}) {
    if (oldPreferences.iconColor !== newPreferences.iconColor) {
      this.browseraction.setIcon(newPreferences.iconColor);
    }
    if (oldPreferences.browserActionPopup !== newPreferences.browserActionPopup) {
      if (newPreferences.browserActionPopup) {
        this.browseraction.setPopup();
      } else {
        this.browseraction.unsetPopup();
      }
    }
    if (oldPreferences.isolation.active !== newPreferences.isolation.active) {
      if (newPreferences.isolation.active) {
        this.browseraction.removeIsolationInactiveBadge();
      } else {
        this.browseraction.addIsolationInactiveBadge();
      }
    }
    if (newPreferences.notifications) {
      this.permissions.notifications = true;
    }
    if (newPreferences.deletesHistory.active) {
      this.permissions.history = true;
    }

    if (oldPreferences.contextMenu !== newPreferences.contextMenu ||
      oldPreferences.contextMenuBookmarks !== newPreferences.contextMenuBookmarks ||
      oldPreferences.deletesHistory.contextMenu !== newPreferences.deletesHistory.contextMenu ||
      oldPreferences.deletesHistory.contextMenuBookmarks !== newPreferences.deletesHistory.contextMenuBookmarks)  {
      await this.contextmenu.remove();
      this.contextmenu.add();
    }
  }
}

window.Preferences = Preferences;