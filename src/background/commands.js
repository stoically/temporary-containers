class Commands {
  constructor(background) {
    this.background = background;
  }


  initialize() {
    this.pref = this.background.pref;
    this.storage = this.background.storage;
    this.container = this.background.container;
    this.permissions = this.background.permissions;
    this.tabs = this.background.tabs;

    browser.commands.onCommand.addListener(this.onCommand.bind(this));
  }


  async onCommand(name) {
    switch(name) {
    case 'new_temporary_container_tab':
      if (!this.pref.keyboardShortcuts.AltC) {
        return;
      }
      this.container.createTabInTempContainer({
        deletesHistory: this.pref.deletesHistory.automaticMode === 'automatic'
      });
      break;

    case 'new_no_container_tab':
      if (!this.pref.keyboardShortcuts.AltN) {
        return;
      }
      try {
        const tab = await browser.tabs.create({
          url: 'about:blank'
        });
        this.container.noContainerTabs[tab.id] = true;
        debug('[onCommand] new no container tab created', this.container.noContainerTabs);
      } catch (error) {
        debug('[onCommand] couldnt create tab', error);
      }
      break;

    case 'new_no_container_window_tab':
      if (!this.pref.keyboardShortcuts.AltShiftC) {
        return;
      }
      try {
        const window = await browser.windows.create({
          url: 'about:blank'
        });
        this.container.noContainerTabs[window.tabs[0].id] = true;
        debug('[onCommand] new no container tab created in window', window, this.container.noContainerTabs);
      } catch (error) {
        debug('[onCommand] couldnt create tab in window', error);
      }
      break;

    case 'new_no_history_tab':
      if (!this.pref.keyboardShortcuts.AltP) {
        return;
      }
      if (this.permissions.history) {
        this.container.createTabInTempContainer({deletesHistory: true});
      }
      break;

    case 'new_same_container_tab':
      if (!this.pref.keyboardShortcuts.AltX) {
        return;
      }
      this.tabs.createInSameContainer();
      break;
    }
  }
}

window.Commands = Commands;