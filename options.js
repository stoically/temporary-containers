const savePreferences = async (event) => {
  event.preventDefault();

  const preferences = {
    automaticMode: document.querySelector('#automaticMode').checked
  };

  const messageBox = document.querySelector('#message');
  try {
    await browser.runtime.sendMessage({
      savePreferences: {
        preferences
      }
    });

    messageBox.innerHTML = 'Preferences saved.';
    setTimeout(() => {
      messageBox.innerHTML = '';
    }, 5000);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.log('error while saving preferences', error);
    messageBox.innerHTML = 'Error while saving preferences!';
  }
};

const restorePreferences = async () => {
  const setCurrentPreferences = (preferences) => {
    if (!preferences) {
      preferences = {};
    }
    if (preferences.automaticMode === undefined) {
      preferences.automaticMode = true;
    }
    document.querySelector('#automaticMode').checked = preferences.automaticMode;
  };

  const { preferences } = await browser.storage.local.get('preferences');
  setCurrentPreferences(preferences);
};

document.addEventListener('DOMContentLoaded', restorePreferences);
document.querySelector('form').addEventListener('submit', savePreferences);
