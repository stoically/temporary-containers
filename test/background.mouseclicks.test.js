describe('preferences for mouse clicks per domain', () => {
  it('global middle mouse allowed by default', async () => {
    const fakeSender = {
      tab: {
        id: 1,
        cookieStoreId: 'firefox-tmp-container-1',
        url: 'https://notexample.com'
      }
    };
    const fakeMessage = {
      linkClicked: {
        href: 'https://example.com',
        event: {
          button: 1
        }
      }
    };
    const background = await loadBackground();
    await background.runtimeOnMessage(fakeMessage, fakeSender);
    background.automaticModeState.linkClicked[fakeMessage.linkClicked.href].should.exist;
  });

  it('global middle mouse same domain (ignore)', async () => {
    const fakeSender = {
      tab: {
        id: 1,
        cookieStoreId: 'firefox-tmp-container-1',
        url: 'https://notexample.com'
      }
    };
    const fakeMessage = {
      linkClicked: {
        href: 'https://example.com',
        event: {
          button: 1
        }
      }
    };

    const background = await loadBackground();
    background.storage.preferences.linkClickGlobal.middle.action = 'notsamedomain';
    await background.runtimeOnMessage(fakeMessage, fakeSender);
    expect(background.automaticModeState.linkClicked[fakeMessage.linkClicked.href]).to.be.undefined;
  });

  it('global middle mouse same domain (handle)', async () => {
    const fakeSender = {
      tab: {
        id: 1,
        cookieStoreId: 'firefox-tmp-container-1',
        url: 'https://example.com'
      }
    };
    const fakeMessage = {
      linkClicked: {
        href: 'https://not.example.com',
        event: {
          button: 1
        }
      }
    };

    const background = await loadBackground();
    background.storage.preferences.linkClickGlobal.middle.action = 'notsamedomain';
    await background.runtimeOnMessage(fakeMessage, fakeSender);
    expect(background.automaticModeState.linkClicked[fakeMessage.linkClicked.href]).to.not.be.undefined;
  });

  it('global middle mouse exact same domain (fail)', async () => {
    const fakeSender = {
      tab: {
        id: 1,
        cookieStoreId: 'firefox-tmp-container-1',
        url: 'https://not.example.com'
      }
    };
    const fakeMessage = {
      linkClicked: {
        href: 'https://example.com',
        event: {
          button: 1
        }
      }
    };

    const background = await loadBackground();
    background.storage.preferences.linkClickGlobal.middle.action = 'notsamedomainexact';
    await background.runtimeOnMessage(fakeMessage, fakeSender);
    expect(background.automaticModeState.linkClicked[fakeMessage.linkClicked.href]).to.be.undefined;
  });

  it('global middle mouse exact same domain (handle)', async () => {
    const fakeSender = {
      tab: {
        id: 1,
        cookieStoreId: 'firefox-tmp-container-1',
        url: 'https://example.com'
      }
    };
    const fakeMessage = {
      linkClicked: {
        href: 'https://example.com/whatever',
        event: {
          button: 1
        }
      }
    };

    const background = await loadBackground();
    background.storage.preferences.linkClickGlobal.middle.action = 'notsamedomainexact';
    await background.runtimeOnMessage(fakeMessage, fakeSender);
    expect(background.automaticModeState.linkClicked[fakeMessage.linkClicked.href]).to.not.be.undefined;
  });

  it('global ctrl+left mouse allowed', async () => {
    const fakeSender = {
      tab: {
        id: 1,
        cookieStoreId: 'firefox-tmp-container-1',
        url: 'https://notexample.com'
      }
    };
    const fakeMessage = {
      linkClicked: {
        href: 'https://example.com',
        event: {
          button: 0,
          ctrlKey: true
        }
      }
    };
    const background = await loadBackground();
    await background.runtimeOnMessage(fakeMessage, fakeSender);
    background.automaticModeState.linkClicked[fakeMessage.linkClicked.href].should.exist;
  });

  it('global ctrl+left mouse same domain (ignore)', async () => {
    const fakeSender = {
      tab: {
        id: 1,
        cookieStoreId: 'firefox-tmp-container-1',
        url: 'https://notexample.com'
      }
    };
    const fakeMessage = {
      linkClicked: {
        href: 'https://example.com',
        event: {
          button: 0,
          ctrlKey: true
        }
      }
    };

    const background = await loadBackground();
    background.storage.preferences.linkClickGlobal.ctrlleft.action = 'notsamedomain';
    await background.runtimeOnMessage(fakeMessage, fakeSender);
    expect(background.automaticModeState.linkClicked[fakeMessage.linkClicked.href]).to.be.undefined;
  });

  it('global ctrl+left mouse same domain (handle)', async () => {
    const fakeSender = {
      tab: {
        id: 1,
        cookieStoreId: 'firefox-tmp-container-1',
        url: 'https://not.example.com'
      }
    };
    const fakeMessage = {
      linkClicked: {
        href: 'https://example.com',
        event: {
          button: 0,
          ctrlKey: true
        }
      }
    };

    const background = await loadBackground();
    background.storage.preferences.linkClickGlobal.ctrlleft.action = 'notsamedomain';
    await background.runtimeOnMessage(fakeMessage, fakeSender);
    expect(background.automaticModeState.linkClicked[fakeMessage.linkClicked.href]).to.not.be.undefined;
  });

  it('global ctrl+left mouse exact same domain (fail)', async () => {
    const fakeSender = {
      tab: {
        id: 1,
        cookieStoreId: 'firefox-tmp-container-1',
        url: 'https://not.example.com'
      }
    };
    const fakeMessage = {
      linkClicked: {
        href: 'https://example.com',
        event: {
          button: 0,
          ctrlKey: true
        }
      }
    };

    const background = await loadBackground();
    background.storage.preferences.linkClickGlobal.ctrlleft.action = 'notsamedomainexact';
    await background.runtimeOnMessage(fakeMessage, fakeSender);
    expect(background.automaticModeState.linkClicked[fakeMessage.linkClicked.href]).to.be.undefined;
  });

  it('global ctrl+left mouse exact same domain (handle)', async () => {
    const fakeSender = {
      tab: {
        id: 1,
        cookieStoreId: 'firefox-tmp-container-1',
        url: 'https://example.com'
      }
    };
    const fakeMessage = {
      linkClicked: {
        href: 'https://example.com/whatever',
        event: {
          button: 0,
          ctrlKey: true
        }
      }
    };

    const background = await loadBackground();
    background.storage.preferences.linkClickGlobal.ctrlleft.action = 'notsamedomainexact';
    await background.runtimeOnMessage(fakeMessage, fakeSender);
    expect(background.automaticModeState.linkClicked[fakeMessage.linkClicked.href]).to.not.be.undefined;
  });
});
