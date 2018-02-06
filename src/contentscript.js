document.body.addEventListener('mouseup', async (event) => {
  // event valid?
  if (typeof event !== 'object' || typeof event.target !== 'object') {
    return;
  }

  // don't handle right mouse button
  if (event.button === 2) {
    return;
  }

  // check for a element with href
  const aElement = event.target.closest('a');
  if (aElement === null || typeof aElement !== 'object' || !aElement.href) {
    return;
  }

  // tell background process to handle the clicked url
  await browser.runtime.sendMessage({
    method: 'linkClicked',
    payload: {
      href: aElement.href,
      event: {
        button: event.button,
        ctrlKey: event.ctrlKey,
        metaKey: event.metaKey
      }
    }
  });
}, false);
