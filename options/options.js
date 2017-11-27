
const messageBox = $('#message');
const showMessage = (message) => {
  messageBox.html(message);
  messageBox.addClass('positive');
  messageBox.removeClass('negative');
  messageBox.removeClass('hidden');
  setTimeout(() => {
    messageBox.addClass('hidden');
  }, 3000);
};
const showError = (error) => {
  messageBox.html(error);
  messageBox.addClass('negative');
  messageBox.removeClass('positive');
  messageBox.removeClass('hidden');
};
const savePreferences = async (event) => {
  event.preventDefault();

  const preferences = {
    automaticMode: document.querySelector('#automaticMode').checked,
    containerNamePrefix: document.querySelector('#containerNamePrefix').value,
    containerColor: document.querySelector('#containerColor').value,
    containerColorRandom: document.querySelector('#containerColorRandom').checked,
    containerIcon: document.querySelector('#containerIcon').value,
    containerIconRandom: document.querySelector('#containerIconRandom').checked,
    containerNumberMode: document.querySelector('#containerNumberMode').value
  };

  try {
    await browser.runtime.sendMessage({
      savePreferences: {
        preferences
      }
    });

    showMessage('Preferences saved.');

  } catch (error) {
    // eslint-disable-next-line no-console
    console.log('error while saving preferences', error);
    showError('Error while saving preferences!');
  }
};

const restorePreferences = async () => {
  $('.ui.dropdown').dropdown();
  $('.ui.checkbox').checkbox();
  const setCurrentPreferences = (preferences) => {
    document.querySelector('#automaticMode').checked = preferences.automaticMode;
    document.querySelector('#containerNamePrefix').value = preferences.containerNamePrefix;
    $('#containerColor').dropdown('set selected', preferences.containerColor);
    document.querySelector('#containerColorRandom').checked = preferences.containerColorRandom;
    $('#containerIcon').dropdown('set selected', preferences.containerIcon);
    document.querySelector('#containerIconRandom').checked = preferences.containerIconRandom;
    $('#containerNumberMode').dropdown('set selected', preferences.containerNumberMode);
  };

  const { preferences } = await browser.storage.local.get('preferences');
  if (!preferences) {
    showError('Error while loading preferences.');
    return;
  }
  setCurrentPreferences(preferences);
};

document.addEventListener('DOMContentLoaded', restorePreferences);
document.querySelector('form').addEventListener('submit', savePreferences);
