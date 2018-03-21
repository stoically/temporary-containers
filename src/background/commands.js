class Commands {
  initialize(background) {
    this.storage = background.storage;
    this.container = background.container;
    this.permissions = background.permissions;

    browser.commands.onCommand.addListener(this.commandsOnCommand.bind(this));
  }

  async commandsOnCommand(name) {
    switch(name) {
    case 'new_temporary_container_tab':
      if (!this.storage.local.preferences.keyboardShortcuts.AltC) {
        return;
      }
      this.container.createTabInTempContainer({
        deletesHistory: this.storage.local.preferences.deletesHistoryContainer === 'automatic'
      });
      break;

    case 'new_no_container_tab':
      if (!this.storage.local.preferences.keyboardShortcuts.AltN) {
        return;
      }
      try {
        const tab = await browser.tabs.create({
          url: 'about:blank'
        });
        this.storage.local.noContainerTabs[tab.id] = true;
        debug('[commandsOnCommand] new no container tab created', this.storage.local.noContainerTabs);
      } catch (error) {
        debug('[commandsOnCommand] couldnt create tab', error);
      }
      break;

    case 'new_no_container_window_tab':
      if (!this.storage.local.preferences.keyboardShortcuts.AltShiftC) {
        return;
      }
      try {
        const window = await browser.windows.create({
          url: 'about:blank'
        });
        this.storage.local.noContainerTabs[window.tabs[0].id] = true;
        debug('[commandsOnCommand] new no container tab created in window', window, this.storage.local.noContainerTabs);
      } catch (error) {
        debug('[commandsOnCommand] couldnt create tab in window', error);
      }
      break;

    case 'new_no_history_tab':
      if (!this.storage.local.preferences.keyboardShortcuts.AltP) {
        return;
      }
      if (this.permissions.history) {
        this.container.createTabInTempContainer({deletesHistory: true});
      }
      break;

    case 'new_same_container_tab':
      if (!this.storage.local.preferences.keyboardShortcuts.AltX) {
        return;
      }
      this.container.createTabInSameContainer();
      break;
    }
  }

}

window.Commands = Commands;