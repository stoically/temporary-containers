document.body.addEventListener(
  'mouseup',
  async (event) => {
    // event valid?
    if (typeof event !== 'object' || typeof event.target !== 'object') {
      return;
    }

    // don't handle right mouse button
    if (event.button === 2) {
      return;
    }

    // sometimes websites change links on click
    // so we wait for the next tick and with that increase
    // the chance that we actually see the correct link
    await new Promise((resolve) => setTimeout(resolve));

    // check for a element with href
    const target = event?.target as HTMLElement | null;
    const aElement = target?.closest('a');
    if (!aElement || typeof aElement !== 'object' || !aElement.href) {
      return;
    }

    // tell background process to handle the clicked url
    browser.runtime.sendMessage({
      method: 'linkClicked',
      payload: {
        href: aElement.href,
        event: {
          button: event.button,
          ctrlKey: event.ctrlKey,
          metaKey: event.metaKey,
        },
      },
    });
  },
  false
);
