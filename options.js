const messageBox = document.querySelector('#message');
const savePreferences = async (event) => {
  event.preventDefault();

  const preferences = {
    automaticMode: document.querySelector('#automaticMode').checked,
    containerNamePrefix: document.querySelector('#containerNamePrefix').value,
    containerColor: document.querySelector('#containerColor').value,
    containerColorRandom: document.querySelector('#containerColorRandom').checked,
    containerIcon: document.querySelector('#containerIcon').value,
    containerIconRandom: document.querySelector('#containerIconRandom').checked
  };

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
    document.querySelector('#automaticMode').checked = preferences.automaticMode;
    document.querySelector('#containerNamePrefix').value = preferences.containerNamePrefix;
    document.querySelector('#containerColor').value = preferences.containerColor;
    document.querySelector('#containerColorRandom').value = preferences.containerColorRandom;
    document.querySelector('#containerIcon').value = preferences.containerIcon;
    document.querySelector('#containerIconRandom').value = preferences.containerIconRandom;
  };

  const { preferences } = await browser.storage.local.get('preferences');
  if (!preferences) {
    messageBox.innerHTML = 'Error while loading preferences.';
    return;
  }
  setCurrentPreferences(preferences);
};

document.addEventListener('DOMContentLoaded', restorePreferences);
document.querySelector('form').addEventListener('submit', savePreferences);
