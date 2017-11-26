const savePreferences = async (event) => {
  event.preventDefault();

  const preferences = {
    automaticMode: document.querySelector('#automaticMode').checked
  };

  try {
    await browser.storage.local.set({
      preferences
    });
    const messageBox = document.querySelector('#message');
    messageBox.innerHTML = 'Preferences saved.';
    setTimeout(() => {
      messageBox.innerHTML = '';
    }, 5000);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.log('browser.storage.local.set error', error);
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
