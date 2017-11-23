document.body.addEventListener('mouseup', async function(event) {
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
