describe('preferences for global mouse clicks', () => {
  it('global middle mouse allowed by default', async () => {
    const fakeSender = {
      tab: {
        id: 1,
        url: 'https://notexample.com'
      }
    };
    const fakeMessage = {
      method: 'linkClicked',
      payload: {
        href: 'https://example.com',
        event: {
          button: 1
        }
      }
    };
    const background = await loadBackground();
    await background.runtimeOnMessage(fakeMessage, fakeSender);
    background.mouseclick.linksClicked[fakeMessage.payload.href].should.exist;
  });

  it('global middle mouse same domain (ignore)', async () => {
    const fakeSender = {
      tab: {
        id: 1,
        url: 'https://notexample.com'
      }
    };
    const fakeMessage = {
      method: 'linkClicked',
      payload: {
        href: 'https://example.com',
        event: {
          button: 1
        }
      }
    };

    const background = await loadBackground();
    background.storage.local.preferences.linkClickGlobal.middle.action = 'notsamedomain';
    await background.runtimeOnMessage(fakeMessage, fakeSender);
    expect(background.mouseclick.linksClicked[fakeMessage.payload.href]).not.to.be.undefined;
  });

  it('global middle mouse same domain (handle)', async () => {
    const fakeSender = {
      tab: {
        id: 1,
        url: 'https://example.com'
      }
    };
    const fakeMessage = {
      method: 'linkClicked',
      payload: {
        href: 'https://not.example.com',
        event: {
          button: 1
        }
      }
    };

    const background = await loadBackground();
    background.storage.local.preferences.linkClickGlobal.middle.action = 'notsamedomain';
    await background.runtimeOnMessage(fakeMessage, fakeSender);
    expect(background.mouseclick.linksClicked[fakeMessage.payload.href]).to.be.undefined;
  });

  it('global middle mouse exact same domain (fail)', async () => {
    const fakeSender = {
      tab: {
        id: 1,
        url: 'https://not.example.com'
      }
    };
    const fakeMessage = {
      method: 'linkClicked',
      payload: {
        href: 'https://example.com',
        event: {
          button: 1
        }
      }
    };

    const background = await loadBackground();
    background.storage.local.preferences.linkClickGlobal.middle.action = 'notsamedomainexact';
    await background.runtimeOnMessage(fakeMessage, fakeSender);
    expect(background.mouseclick.linksClicked[fakeMessage.payload.href]).not.to.be.undefined;
  });

  it('global middle mouse exact same domain (handle)', async () => {
    const fakeSender = {
      tab: {
        id: 1,
        url: 'https://example.com'
      }
    };
    const fakeMessage = {
      method: 'linkClicked',
      payload: {
        href: 'https://example.com/whatever',
        event: {
          button: 1
        }
      }
    };

    const background = await loadBackground();
    background.storage.local.preferences.linkClickGlobal.middle.action = 'notsamedomainexact';
    await background.runtimeOnMessage(fakeMessage, fakeSender);
    expect(background.mouseclick.linksClicked[fakeMessage.payload.href]).to.be.undefined;
  });

  it('global ctrl+left mouse allowed', async () => {
    const fakeSender = {
      tab: {
        id: 1,
        url: 'https://notexample.com'
      }
    };
    const fakeMessage = {
      method: 'linkClicked',
      payload: {
        href: 'https://example.com',
        event: {
          button: 0,
          ctrlKey: true
        }
      }
    };
    const background = await loadBackground();
    await background.runtimeOnMessage(fakeMessage, fakeSender);
    expect(background.mouseclick.linksClicked[fakeMessage.payload.href]).not.to.be.undefined;
  });

  it('global meta+left mouse allowed', async () => {
    const fakeSender = {
      tab: {
        id: 1,
        url: 'https://notexample.com'
      }
    };
    const fakeMessage = {
      method: 'linkClicked',
      payload: {
        href: 'https://example.com',
        event: {
          button: 0,
          metaKey: true
        }
      }
    };
    const background = await loadBackground();
    await background.runtimeOnMessage(fakeMessage, fakeSender);
    expect(background.mouseclick.linksClicked[fakeMessage.payload.href]).not.to.be.undefined;
  });

  it('global ctrl+left mouse same domain (ignore)', async () => {
    const fakeSender = {
      tab: {
        id: 1,
        url: 'https://notexample.com'
      }
    };
    const fakeMessage = {
      method: 'linkClicked',
      payload: {
        href: 'https://example.com',
        event: {
          button: 0,
          ctrlKey: true
        }
      }
    };

    const background = await loadBackground();
    background.storage.local.preferences.linkClickGlobal.ctrlleft.action = 'notsamedomain';
    await background.runtimeOnMessage(fakeMessage, fakeSender);
    expect(background.mouseclick.linksClicked[fakeMessage.payload.href]).not.to.be.undefined;
  });

  it('global ctrl+left mouse same domain (handle)', async () => {
    const fakeSender = {
      tab: {
        id: 1,
        url: 'https://not.example.com'
      }
    };
    const fakeMessage = {
      method: 'linkClicked',
      payload: {
        href: 'https://example.com',
        event: {
          button: 0,
          ctrlKey: true
        }
      }
    };

    const background = await loadBackground();
    background.storage.local.preferences.linkClickGlobal.ctrlleft.action = 'notsamedomain';
    await background.runtimeOnMessage(fakeMessage, fakeSender);
    expect(background.mouseclick.linksClicked[fakeMessage.payload.href]).to.be.undefined;
  });

  it('global ctrl+left mouse exact same domain (fail)', async () => {
    const fakeSender = {
      tab: {
        id: 1,
        url: 'https://not.example.com'
      }
    };
    const fakeMessage = {
      method: 'linkClicked',
      payload: {
        href: 'https://example.com',
        event: {
          button: 0,
          ctrlKey: true
        }
      }
    };

    const background = await loadBackground();
    background.storage.local.preferences.linkClickGlobal.ctrlleft.action = 'notsamedomainexact';
    await background.runtimeOnMessage(fakeMessage, fakeSender);
    expect(background.mouseclick.linksClicked[fakeMessage.payload.href]).not.to.be.undefined;
  });

  it('global ctrl+left mouse exact same domain (handle)', async () => {
    const fakeSender = {
      tab: {
        id: 1,
        url: 'https://example.com'
      }
    };
    const fakeMessage = {
      method: 'linkClicked',
      payload: {
        href: 'https://example.com/whatever',
        event: {
          button: 0,
          ctrlKey: true
        }
      }
    };

    const background = await loadBackground();
    background.storage.local.preferences.linkClickGlobal.ctrlleft.action = 'notsamedomainexact';
    await background.runtimeOnMessage(fakeMessage, fakeSender);
    expect(background.mouseclick.linksClicked[fakeMessage.payload.href]).to.be.undefined;
  });
});

describe('preferences for mouse clicks per domain', () => {
  it('middle mouse per domain: never', async () => {
    const fakeSender = {
      tab: {
        id: 1,
        url: 'https://example.com'
      }
    };
    const fakeMessage = {
      method: 'linkClicked',
      payload: {
        href: 'https://not.example.com',
        event: {
          button: 1
        }
      }
    };

    const background = await loadBackground();
    background.storage.local.preferences.linkClickDomain['example.com'] = {
      middle: {
        action: 'never'
      }
    };
    await background.runtimeOnMessage(fakeMessage, fakeSender);
    expect(background.mouseclick.linksClicked[fakeMessage.payload.href]).to.be.undefined;
  });

  it('middle mouse per domain: notsamedomainexact (handle)', async () => {
    const fakeSender = {
      tab: {
        id: 1,
        url: 'https://example.com'
      }
    };
    const fakeMessage = {
      method: 'linkClicked',
      payload: {
        href: 'https://not.example.com',
        event: {
          button: 1
        }
      }
    };

    const background = await loadBackground();
    background.storage.local.preferences.linkClickDomain['example.com'] = {
      middle: {
        action: 'notsamedomainexact'
      }
    };
    await background.runtimeOnMessage(fakeMessage, fakeSender);
    expect(background.mouseclick.linksClicked[fakeMessage.payload.href]).not.to.be.undefined;
  });

  it('middle mouse per domain: notsamedomainexact (ignore)', async () => {
    const fakeSender = {
      tab: {
        id: 1,
        url: 'https://example.com'
      }
    };
    const fakeMessage = {
      method: 'linkClicked',
      payload: {
        href: 'https://example.com/whatever',
        event: {
          button: 1
        }
      }
    };

    const background = await loadBackground();
    background.storage.local.preferences.linkClickDomain['example.com'] = {
      middle: {
        action: 'notsamedomainexact'
      }
    };
    await background.runtimeOnMessage(fakeMessage, fakeSender);
    expect(background.mouseclick.linksClicked[fakeMessage.payload.href]).to.be.undefined;
  });

  it('middle mouse per domain: notsamedomain (handle)', async () => {
    const fakeSender = {
      tab: {
        id: 1,
        url: 'https://example.com'
      }
    };
    const fakeMessage = {
      method: 'linkClicked',
      payload: {
        href: 'https://not.example.com',
        event: {
          button: 1
        }
      }
    };

    const background = await loadBackground();
    background.storage.local.preferences.linkClickDomain['example.com'] = {
      middle: {
        action: 'notsamedomain'
      }
    };
    await background.runtimeOnMessage(fakeMessage, fakeSender);
    expect(background.mouseclick.linksClicked[fakeMessage.payload.href]).to.be.undefined;
  });

  it('middle mouse per domain: notsamedomain (handle)', async () => {
    const fakeSender = {
      tab: {
        id: 1,
        url: 'https://example.com'
      }
    };
    const fakeMessage = {
      method: 'linkClicked',
      payload: {
        href: 'https://notexample.com',
        event: {
          button: 1
        }
      }
    };

    const background = await loadBackground();
    background.storage.local.preferences.linkClickDomain['example.com'] = {
      middle: {
        action: 'notsamedomain'
      }
    };
    await background.runtimeOnMessage(fakeMessage, fakeSender);
    expect(background.mouseclick.linksClicked[fakeMessage.payload.href]).not.to.be.undefined;
  });

  it('per domain should only handle the relevant domain (exact)', async () => {
    const fakeSender = {
      tab: {
        id: 1,
        url: 'https://example.com'
      }
    };
    const fakeMessage = {
      method: 'linkClicked',
      payload: {
        href: 'https://notexample.com',
        event: {
          button: 1
        }
      }
    };

    const background = await loadBackground();
    background.storage.local.preferences.linkClickGlobal.middle.action = 'never';
    background.storage.local.preferences.linkClickDomain['whynotexample.com'] = {
      middle: {
        action: 'always'
      }
    };
    await background.runtimeOnMessage(fakeMessage, fakeSender);
    expect(background.mouseclick.linksClicked[fakeMessage.payload.href]).to.be.undefined;
  });

  it('per domain should overwrite global', async () => {
    const fakeSender = {
      tab: {
        id: 1,
        url: 'https://example.com'
      }
    };
    const fakeMessage = {
      method: 'linkClicked',
      payload: {
        href: 'https://notexample.com',
        event: {
          button: 1
        }
      }
    };

    const background = await loadBackground();
    background.storage.local.preferences.linkClickGlobal.middle.action = 'never';
    background.storage.local.preferences.linkClickDomain['example.com'] = {
      middle: {
        action: 'always'
      }
    };
    await background.runtimeOnMessage(fakeMessage, fakeSender);
    expect(background.mouseclick.linksClicked[fakeMessage.payload.href]).not.to.be.undefined;
  });

  it('per domain should handle the relevant domain (glob)', async () => {
    const fakeSender = {
      tab: {
        id: 1,
        url: 'https://www.example.com'
      }
    };
    const fakeMessage = {
      method: 'linkClicked',
      payload: {
        href: 'https://not.example.com',
        event: {
          button: 1
        }
      }
    };

    const background = await loadBackground();
    background.storage.local.preferences.linkClickDomain['*.example.com'] = {
      middle: {
        action: 'never'
      }
    };
    await background.runtimeOnMessage(fakeMessage, fakeSender);
    expect(background.mouseclick.linksClicked[fakeMessage.payload.href]).to.be.undefined;
  });

});
