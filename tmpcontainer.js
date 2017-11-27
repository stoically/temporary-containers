let preferences = {};
const initialize = async () => {
  try {
    const storage = await browser.storage.local.get('preferences');
    preferences = storage.preferences;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.log('something went wrong while loading preferences', error);
    // TODO: inform user? retry?
    return;
  }
};
initialize();

document.body.addEventListener('mouseup', async function(event) {
  // is automatic mode enabled anyway?
  if (!preferences.automaticMode) {
    return;
  }

  // event valid?
  if (typeof event !== 'object' || typeof event.target !== 'object') {
    return;
  }

  // don't handle right mouse button
  if (event.button === 2) {
    return;
  }

  // only handle left mouse click if ctrl was clicked
  if (event.button === 0 && !event.ctrlKey) {
    return;
  }

  // check for a element with href
  const aElement = event.target.closest('a');
  if (typeof aElement !== 'object' || !aElement.href) {
    return;
  }

  // tell background process to handle the clicked url
  await browser.runtime.sendMessage({
    linkClicked: {
      href: aElement.href
    }
  });

}, false);
