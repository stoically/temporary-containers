// When a tab starts loading an URL that is assigned using MAC (Multi-Account Containers)
// it will cancel our request, close the tab and reopen it in
// * "Always open in" Confirm Page
// * "Always open in" and "Remember my choice" Target Container
//
// The thing is, we want it to open in a new Temporary Container instead,
// so we have to try to guess that MAC intervenes and handle these cases
//
// What makes the whole thing somewhat complicated is that requests
// can come in different variations based on Firefox versions, installed Add-ons and
// even available CPU / RAM
//
// This is a collection of tests to make sure different variations of requests are
// handled as good as possible
//
// To handle this in a sane way we need an API to MAC
//
// side-note: preventDetault of middlemouse click does not work in firefox
// > https://jsfiddle.net/3fjqr43v/
// > https://bugzilla.mozilla.org/show_bug.cgi?id=1374096

describe('raceconditions with multi-account-containers', () => {
  describe('when not previously clicked url loads thats set to "always open in $container" but not "remember my choice"', () => {
    it('should leave the first confirm page open', async () => {
      // the first request triggered multi-account-containers and we just leave it open
      const fakeMATabId = 3;
      const fakeMAUrl = 'moz-extension://multi-account-containers/confirm-page.html?url=' +
        encodeURIComponent('https://example.com') + '&cookieStoreId=firefox-container-1' +
        '&currentCookieStoreId=firefox-tmp-container-1';
      const fakeMAChangeInfo = {
        url: fakeMAUrl
      };
      const fakeMATab = {
        id: fakeMATabId,
        cookieStoreId: 'firefox-tmp-container-1',
        url: fakeMAUrl
      };

      browser.tabs.remove.reset();
      const background = await loadBackground();
      const result3 = await background.tabsOnUpdated(fakeMATabId, fakeMAChangeInfo, fakeMATab);

      expect(result3).to.be.undefined;
      browser.tabs.remove.should.not.have.been.called;

      // request comes in and we just ignore it because its loading in a temporary container and wasnt clicked
      const fakeRequest = {
        tabId: 1,
        url: 'https://example.com'
      };
      const fakeTab = {
        id: 1,
        cookieStoreId: 'firefox-tmp-container-1'
      };
      browser.tabs.get.resolves(fakeTab);
      const result1 = await background.request.webRequestOnBeforeRequest(fakeRequest);

      expect(result1).to.be.undefined;
      browser.tabs.remove.should.not.have.been.called;
      browser.contextualIdentities.create.should.not.have.been.calledOnce;
      browser.tabs.create.should.not.have.been.calledOnce;

    });

    it('should leave the first confirm page open if its already in a temporary container', async () => {
      // request comes in and we just ignore it because its loading in a temporary container and wasnt clicked
      const fakeRequest = {
        tabId: 1,
        url: 'https://example.com'
      };
      const fakeTab = {
        id: 1,
        cookieStoreId: 'firefox-tmp-container-1'
      };
      browser.tabs.get.resolves(fakeTab);
      const background = await loadBackground();
      const result1 = await background.request.webRequestOnBeforeRequest(fakeRequest);

      expect(result1).to.be.undefined;
      browser.tabs.remove.should.not.have.been.called;
      browser.contextualIdentities.create.should.not.have.been.calledOnce;
      browser.tabs.create.should.not.have.been.calledOnce;

      // the first request already triggered multi-account-containers
      // it opened another tab that updates its url to moz-extension:// eventually
      // it also already removed our tab2 and we just leave it open
      const fakeMATabId = 3;
      const fakeMAUrl = 'moz-extension://multi-account-containers/confirm-page.html?url=' +
        encodeURIComponent('https://example.com') + '&cookieStoreId=firefox-container-1' +
        '&currentCookieStoreId=firefox-tmp-container-1';
      const fakeMAChangeInfo = {
        url: fakeMAUrl
      };
      const fakeMATab = {
        id: fakeMATabId,
        cookieStoreId: 'firefox-tmp-container-1',
        url: fakeMAUrl
      };

      browser.tabs.remove.reset();
      const result3 = await background.tabsOnUpdated(fakeMATabId, fakeMAChangeInfo, fakeMATab);

      expect(result3).to.be.undefined;
      browser.tabs.remove.should.not.have.been.called;
    });

    it('should close first confirm page and leave the second open', async () => {
      // request comes in, we cancel it, close the tab and reopen in temp container
      const fakeRequest = {
        tabId: 1,
        url: 'https://example.com'
      };
      const fakeTab = {
        id: 1,
        cookieStoreId: 'firefox-default'
      };
      const fakeCreatedTab = {
        id: 2,
        cookieStoreId: 'firefox-tmp-container-1'
      };
      const fakeContainer = {
        cookieStoreId: 'firefox-tmp-container-1'
      };
      browser.tabs.get.resolves(fakeTab);
      browser.contextualIdentities.create.resolves(fakeContainer);
      browser.tabs.create.resolves(fakeCreatedTab);
      const background = await loadBackground();
      const result1 = await background.request.webRequestOnBeforeRequest(fakeRequest);

      result1.should.deep.equal({cancel: true});
      browser.tabs.remove.should.have.been.calledWith(1);
      browser.contextualIdentities.create.should.have.been.calledOnce;
      browser.tabs.create.should.have.been.calledOnce;

      // the tab 2 we opened now makes its request
      // should normally go through (hence we do nothing)
      const fakeRequest2 = {
        tabId: 2,
        url: 'https://example.com'
      };
      const fakeTab2 = {
        id: 2,
        cookieStoreId: 'firefox-tmp-container-1'
      };
      browser.contextualIdentities.create.reset();
      browser.tabs.create.reset();
      browser.tabs.get.resolves(fakeTab2);
      const result2 = await background.request.webRequestOnBeforeRequest(fakeRequest2);

      expect(result2).to.be.undefined;
      browser.contextualIdentities.create.should.not.have.been.called;
      browser.tabs.create.should.not.have.been.called;

      // the first request already triggered multi-account-containers
      // it opened another tab that updates its url to moz-extension:// eventually
      // it also already removed our tab2
      // so we're now going to remove it
      const fakeMATabId = 3;
      const fakeMAUrl = 'moz-extension://multi-account-containers/confirm-page.html?url=' +
        encodeURIComponent('https://example.com') + '&cookieStoreId=firefox-container-1';
      const fakeMAChangeInfo = {
        url: fakeMAUrl
      };
      const fakeMATab = {
        id: fakeMATabId,
        cookieStoreId: 'firefox-default',
        url: fakeMAUrl
      };

      browser.tabs.remove.reset();
      const result3 = await background.tabsOnUpdated(fakeMATabId, fakeMAChangeInfo, fakeMATab);

      expect(result3).to.be.undefined;
      browser.tabs.remove.should.have.been.calledWith(3);

      // tab 2 opening the url in another container triggered multi-account-containers again
      // but this time its ok and we should leave the confirm page open
      const fakeMATabId2 = 3;
      const fakeMAUrl2 = 'moz-extension://multi-account-containers/confirm-page.html?url=' +
        encodeURIComponent('https://example.com') + '&cookieStoreId=firefox-container-1' +
        '&currentCookieStoreId=firefox-tmp-container-1';
      const fakeMAChangeInfo2 = {
        url: fakeMAUrl2
      };
      const fakeMATab2 = {
        id: fakeMATabId2,
        cookieStoreId: 'firefox-default',
        url: fakeMAUrl2
      };

      browser.tabs.remove.reset();
      const result4 = await background.tabsOnUpdated(fakeMATabId2, fakeMAChangeInfo2, fakeMATab2);

      expect(result4).to.be.undefined;
      browser.tabs.remove.should.not.have.been.called;
    });

    it('should close first confirm page and leave the second open even when we see mac confirm first', async () => {
      // the first request already triggered multi-account-containers
      // it opened another tab that updates its url to moz-extension:// eventually
      // it also already removed our tab2
      // so we're now going to remove it
      const fakeMATabId = 3;
      const fakeMAUrl = 'moz-extension://multi-account-containers/confirm-page.html?url=' +
        encodeURIComponent('https://example.com') + '&cookieStoreId=firefox-container-1' +
        '&currentCookieStoreId=firefox-tmp-container-1';
      const fakeMAChangeInfo = {
        url: fakeMAUrl
      };
      const fakeMATab = {
        id: fakeMATabId,
        cookieStoreId: 'firefox-tmp-container-1',
        url: fakeMAUrl
      };

      browser.tabs.remove.reset();
      const background = await loadBackground();
      const result3 = await background.tabsOnUpdated(fakeMATabId, fakeMAChangeInfo, fakeMATab);

      expect(result3).to.be.undefined;
      browser.tabs.remove.should.not.have.been.called;

      // request comes in, we cancel it, close the tab and reopen in temp container
      const fakeRequest = {
        tabId: 1,
        url: 'https://example.com'
      };
      const fakeTab = {
        id: 1,
        cookieStoreId: 'firefox-default'
      };
      const fakeCreatedTab = {
        id: 2,
        cookieStoreId: 'firefox-tmp-container-1'
      };
      const fakeContainer = {
        cookieStoreId: 'firefox-tmp-container-1'
      };
      browser.tabs.get.resolves(fakeTab);
      browser.contextualIdentities.create.resolves(fakeContainer);
      browser.tabs.create.resolves(fakeCreatedTab);
      const result1 = await background.request.webRequestOnBeforeRequest(fakeRequest);

      result1.should.deep.equal({cancel: true});
      browser.tabs.remove.should.have.been.calledWith(1);
      browser.contextualIdentities.create.should.have.been.calledOnce;
      browser.tabs.create.should.have.been.calledOnce;

      // the tab 2 we opened now makes its request
      // should normally go through (hence we do nothing)
      const fakeRequest2 = {
        tabId: 2,
        url: 'https://example.com'
      };
      const fakeTab2 = {
        id: 2,
        cookieStoreId: 'firefox-tmp-container-1'
      };
      browser.contextualIdentities.create.reset();
      browser.tabs.create.reset();
      browser.tabs.get.resolves(fakeTab2);
      const result2 = await background.request.webRequestOnBeforeRequest(fakeRequest2);

      expect(result2).to.be.undefined;
      browser.contextualIdentities.create.should.not.have.been.called;
      browser.tabs.create.should.not.have.been.called;

      // tab 2 opening the url in another container triggered multi-account-containers again
      // but this time its ok and we should leave the confirm page open
      const fakeMATabId2 = 4;
      const fakeMAUrl2 = 'moz-extension://multi-account-containers/confirm-page.html?url=' +
        encodeURIComponent('https://example.com') + '&cookieStoreId=firefox-container-1' +
        '&currentCookieStoreId=firefox-tmp-container-1';
      const fakeMAChangeInfo2 = {
        url: fakeMAUrl2
      };
      const fakeMATab2 = {
        id: fakeMATabId2,
        cookieStoreId: 'firefox-default',
        url: fakeMAUrl2
      };

      browser.tabs.remove.reset();
      const result4 = await background.tabsOnUpdated(fakeMATabId2, fakeMAChangeInfo2, fakeMATab2);

      expect(result4).to.be.undefined;
      browser.tabs.remove.should.have.been.calledWith(3);
      browser.tabs.remove.should.not.have.been.calledWith(4);
    });

    it('should close first confirm page and leave the second open even when mac confirm comes before any request', async () => {
      // since firefox58 the first thing we see is the MAC confirm page
      // MAC already closed the old tab at this point
      const fakeMATabId = 3;
      const fakeMAUrl = 'moz-extension://multi-account-containers/confirm-page.html?url=' +
        encodeURIComponent('https://example.com') + '&cookieStoreId=firefox-container-1' +
        '&currentCookieStoreId=firefox-tmp-container-1';
      const fakeMAChangeInfo = {
        url: fakeMAUrl
      };
      const fakeMATab = {
        id: fakeMATabId,
        cookieStoreId: 'firefox-default',
        url: fakeMAUrl
      };
      const background = await loadBackground();
      const result3 = await background.tabsOnUpdated(fakeMATabId, fakeMAChangeInfo, fakeMATab);

      expect(result3).to.be.undefined;
      browser.tabs.remove.should.have.been.calledWith(3);


      // request comes in, we cancel it, close the tab and reopen in temp container
      const fakeRequest = {
        tabId: 1,
        url: 'https://example.com'
      };
      const fakeCreatedTab = {
        id: 2,
        cookieStoreId: 'firefox-tmp-container-2'
      };
      const fakeContainer = {
        cookieStoreId: 'firefox-tmp-container-2'
      };
      browser.tabs.get.rejects({mac: 'was faster'});
      browser.contextualIdentities.create.resolves(fakeContainer);
      browser.tabs.create.resolves(fakeCreatedTab);
      const result1 = await background.request.webRequestOnBeforeRequest(fakeRequest);

      result1.should.deep.equal({cancel: true});
      browser.tabs.remove.should.have.been.calledWith(1);
      browser.contextualIdentities.create.should.have.been.calledOnce;
      browser.tabs.create.should.have.been.calledOnce;


      // tab 2 opening the url in another container triggered multi-account-containers again
      // but this time its ok and we should leave the confirm page open
      const fakeMATabId2 = 3;
      const fakeMAUrl2 = 'moz-extension://multi-account-containers/confirm-page.html?url=' +
        encodeURIComponent('https://example.com') + '&cookieStoreId=firefox-container-1' +
        '&currentCookieStoreId=firefox-tmp-container-2';
      const fakeMAChangeInfo2 = {
        url: fakeMAUrl2
      };
      const fakeMATab2 = {
        id: fakeMATabId2,
        cookieStoreId: 'firefox-tmp-container-2',
        url: fakeMAUrl2
      };

      browser.tabs.remove.reset();
      const result4 = await background.tabsOnUpdated(fakeMATabId2, fakeMAChangeInfo2, fakeMATab2);

      expect(result4).to.be.undefined;
      browser.tabs.remove.should.not.have.been.called;
    });
  });

  describe('when previously clicked url loads thats set to "always open in $container" but not "remember my choice"', () => {
    it('should close first confirm page and leave the second open', async () => {
      // simulate click
      const fakeSender = {
        tab: {
          id: 123,
          cookieStoreId: 'firefox-tmp-container-123',
          url: 'https://notexample.com'
        }
      };
      const fakeMessage = {
        linkClicked: {
          href: 'https://example.com',
          event: {
            button: 1,
            ctrlKey: false
          }
        }
      };
      const background = await loadBackground();
      await background.runtimeOnMessage(fakeMessage, fakeSender);
      background.automaticModeState.linkClicked[fakeMessage.linkClicked.href].should.exist;

      // request comes in, we cancel it, close the tab and reopen in temp container
      const fakeRequest = {
        tabId: 1,
        url: 'https://example.com'
      };
      const fakeTab = {
        id: 1,
        openerTabId: 123,
        cookieStoreId: 'firefox-tmp-container-123'
      };
      const fakeCreatedTab = {
        id: 2,
        cookieStoreId: 'firefox-tmp-container-1'
      };
      const fakeContainer = {
        cookieStoreId: 'firefox-tmp-container-1'
      };
      browser.tabs.get.resolves(fakeTab);
      browser.contextualIdentities.create.resolves(fakeContainer);
      browser.tabs.create.resolves(fakeCreatedTab);
      const result1 = await background.request.webRequestOnBeforeRequest(fakeRequest);

      result1.should.deep.equal({cancel: true});
      browser.tabs.remove.should.have.been.calledWith(1);
      browser.contextualIdentities.create.should.have.been.calledOnce;
      browser.tabs.create.should.have.been.calledOnce;

      // the tab 2 we opened now makes its request
      // should normally go through (hence we do nothing)
      const fakeRequest2 = {
        tabId: 2,
        url: 'https://example.com'
      };
      const fakeTab2 = {
        id: 2,
        cookieStoreId: 'firefox-tmp-container-1'
      };
      browser.contextualIdentities.create.reset();
      browser.tabs.create.reset();
      browser.tabs.get.resolves(fakeTab2);
      const result2 = await background.request.webRequestOnBeforeRequest(fakeRequest2);

      expect(result2).to.be.undefined;
      browser.contextualIdentities.create.should.not.have.been.called;
      browser.tabs.create.should.not.have.been.called;

      // the first request already triggered multi-account-containers
      // it opened another tab that updates its url to moz-extension:// eventually
      // it also already removed our tab2
      // so we're now going to remove it
      const fakeMATabId = 3;
      const fakeMAUrl = 'moz-extension://multi-account-containers/confirm-page.html?url=' +
        encodeURIComponent('https://example.com') + '&cookieStoreId=firefox-container-1';
      const fakeMAChangeInfo = {
        url: fakeMAUrl
      };
      const fakeMATab = {
        id: fakeMATabId,
        cookieStoreId: 'firefox-default',
        url: fakeMAUrl
      };

      browser.tabs.remove.reset();
      const result3 = await background.tabsOnUpdated(fakeMATabId, fakeMAChangeInfo, fakeMATab);

      expect(result3).to.be.undefined;
      browser.tabs.remove.should.have.been.calledWith(3);

      // tab 2 opening the url in another container triggered multi-account-containers again
      // but this time its ok and we should leave the confirm page open
      const fakeMATabId2 = 3;
      const fakeMAUrl2 = 'moz-extension://multi-account-containers/confirm-page.html?url=' +
        encodeURIComponent('https://example.com') + '&cookieStoreId=firefox-container-1' +
        '&currentCookieStoreId=firefox-tmp-container-1';
      const fakeMAChangeInfo2 = {
        url: fakeMAUrl2
      };
      const fakeMATab2 = {
        id: fakeMATabId2,
        cookieStoreId: 'firefox-default',
        url: fakeMAUrl2
      };

      browser.tabs.remove.reset();
      const result4 = await background.tabsOnUpdated(fakeMATabId2, fakeMAChangeInfo2, fakeMATab2);

      expect(result4).to.be.undefined;
      browser.tabs.remove.should.not.have.been.called;
    });

    it('should close first confirm page and leave the second open (firefox58)', async () => {
      // simulate click
      const fakeSender = {
        tab: {
          id: 123,
          cookieStoreId: 'firefox-tmp-container-123',
          url: 'https://notexample.com'
        }
      };
      const fakeMessage = {
        linkClicked: {
          href: 'https://example.com',
          event: {
            button: 1,
            ctrlKey: false
          }
        }
      };
      const background = await loadBackground();
      await background.runtimeOnMessage(fakeMessage, fakeSender);
      background.automaticModeState.linkClicked[fakeMessage.linkClicked.href].should.exist;

      // request comes in, we cancel it, close the tab and reopen in temp container
      const fakeRequest = {
        tabId: 1,
        url: 'https://example.com'
      };
      const fakeTab = {
        id: 1,
        openerTabId: 123,
        cookieStoreId: 'firefox-tmp-container-123'
      };
      const fakeCreatedTab = {
        id: 2,
        cookieStoreId: 'firefox-tmp-container-1'
      };
      const fakeContainer = {
        cookieStoreId: 'firefox-tmp-container-1'
      };
      browser.tabs.get.resolves(fakeTab);
      browser.contextualIdentities.create.resolves(fakeContainer);
      browser.tabs.create.resolves(fakeCreatedTab);
      const result1 = await background.request.webRequestOnBeforeRequest(fakeRequest);

      result1.should.deep.equal({cancel: true});
      browser.tabs.remove.should.have.been.calledWith(1);
      browser.contextualIdentities.create.should.have.been.calledOnce;
      browser.tabs.create.should.have.been.calledOnce;

      // the first request already triggered multi-account-containers
      // it opened another tab that updates its url to moz-extension:// eventually
      // it also already removed our tab2
      // so we're now going to remove it
      const fakeMATabId = 3;
      const fakeMAUrl = 'moz-extension://multi-account-containers/confirm-page.html?url=' +
        encodeURIComponent('https://example.com') + '&cookieStoreId=firefox-container-1';
      const fakeMAChangeInfo = {
        url: fakeMAUrl
      };
      const fakeMATab = {
        id: fakeMATabId,
        cookieStoreId: 'firefox-default',
        url: fakeMAUrl
      };

      browser.contextualIdentities.create.reset();
      browser.tabs.create.reset();
      browser.tabs.remove.reset();
      const result3 = await background.tabsOnUpdated(fakeMATabId, fakeMAChangeInfo, fakeMATab);

      expect(result3).to.be.undefined;
      browser.contextualIdentities.create.should.not.have.been.called;
      browser.tabs.create.should.not.have.been.called;
      browser.tabs.remove.should.have.been.calledWith(3);

      // the tab 2 we opened now makes its request
      // should normally go through (hence we do nothing)
      const fakeRequest2 = {
        tabId: 2,
        url: 'https://example.com'
      };
      browser.contextualIdentities.create.reset();
      browser.tabs.create.reset();
      browser.tabs.remove.reset();
      browser.tabs.get.rejects({mac: 'was faster'});
      const result2 = await background.request.webRequestOnBeforeRequest(fakeRequest2);

      expect(result2).to.be.undefined;
      browser.contextualIdentities.create.should.not.have.been.called;
      browser.tabs.create.should.not.have.been.called;
      browser.tabs.remove.should.not.have.been.called;

      // tab 2 opening the url in another container triggered multi-account-containers again
      // but this time its ok and we should leave the confirm page open
      const fakeMATabId2 = 3;
      const fakeMAUrl2 = 'moz-extension://multi-account-containers/confirm-page.html?url=' +
        encodeURIComponent('https://example.com') + '&cookieStoreId=firefox-container-1' +
        '&currentCookieStoreId=firefox-tmp-container-1';
      const fakeMAChangeInfo2 = {
        url: fakeMAUrl2
      };
      const fakeMATab2 = {
        id: fakeMATabId2,
        cookieStoreId: 'firefox-default',
        url: fakeMAUrl2
      };

      browser.tabs.remove.reset();
      const result4 = await background.tabsOnUpdated(fakeMATabId2, fakeMAChangeInfo2, fakeMATab2);

      expect(result4).to.be.undefined;
      browser.tabs.remove.should.not.have.been.called;
    });

    it('should close first confirm page and really leave the second open (firefox58)', async () => {
      // simulate click
      const fakeSender = {
        tab: {
          id: 123,
          cookieStoreId: 'firefox-tmp-container-123',
          url: 'https://notexample.com'
        }
      };
      const fakeMessage = {
        linkClicked: {
          href: 'https://example.com',
          event: {
            button: 1,
            ctrlKey: false
          }
        }
      };
      const background = await loadBackground();
      await background.runtimeOnMessage(fakeMessage, fakeSender);
      background.automaticModeState.linkClicked[fakeMessage.linkClicked.href].should.exist;

      // request comes in, we cancel it, close the tab and reopen in temp container
      const fakeRequest = {
        tabId: 1,
        url: 'https://example.com'
      };
      const fakeTab = {
        id: 1,
        openerTabId: 123,
        cookieStoreId: 'firefox-tmp-container-123'
      };
      const fakeCreatedTab = {
        id: 2,
        cookieStoreId: 'firefox-tmp-container-1'
      };
      const fakeContainer = {
        cookieStoreId: 'firefox-tmp-container-1'
      };
      browser.tabs.get.resolves(fakeTab);
      browser.contextualIdentities.create.resolves(fakeContainer);
      browser.tabs.create.resolves(fakeCreatedTab);
      const result1 = await background.request.webRequestOnBeforeRequest(fakeRequest);

      result1.should.deep.equal({cancel: true});
      browser.tabs.remove.should.have.been.calledWith(1);
      browser.contextualIdentities.create.should.have.been.calledOnce;
      browser.tabs.create.should.have.been.calledOnce;

      // the tab 2 we opened now makes its request
      // should normally go through (hence we do nothing)
      const fakeRequest2 = {
        tabId: 2,
        url: 'https://example.com'
      };
      browser.contextualIdentities.create.reset();
      browser.tabs.create.reset();
      browser.tabs.remove.reset();
      browser.tabs.get.resolves(fakeCreatedTab);
      const result2 = await background.request.webRequestOnBeforeRequest(fakeRequest2);

      expect(result2).to.be.undefined;
      browser.contextualIdentities.create.should.not.have.been.called;
      browser.tabs.create.should.not.have.been.called;
      browser.tabs.remove.should.not.have.been.called;

      // the first request already triggered multi-account-containers
      // it opened another tab that updates its url to moz-extension:// eventually
      // it also already removed our tab2
      // so we're now going to remove it
      const fakeMATabId = 3;
      const fakeMAUrl = 'moz-extension://multi-account-containers/confirm-page.html?url=' +
        encodeURIComponent('https://example.com') + '&cookieStoreId=firefox-container-1' +
        '&currentCookieStoreId=firefox-tmp-container-123';
      const fakeMAChangeInfo = {
        url: fakeMAUrl
      };
      const fakeMATab = {
        id: fakeMATabId,
        cookieStoreId: 'firefox-tmp-container-123',
        url: fakeMAUrl
      };

      browser.contextualIdentities.create.reset();
      browser.tabs.create.reset();
      browser.tabs.remove.reset();
      const result3 = await background.tabsOnUpdated(fakeMATabId, fakeMAChangeInfo, fakeMATab);

      expect(result3).to.be.undefined;
      browser.contextualIdentities.create.should.not.have.been.called;
      browser.tabs.create.should.not.have.been.called;
      browser.tabs.remove.should.have.been.calledWith(3);

      // tab 2 opening the url in another container triggered multi-account-containers again
      // but this time its ok and we should leave the confirm page open
      const fakeMATabId2 = 3;
      const fakeMAUrl2 = 'moz-extension://multi-account-containers/confirm-page.html?url=' +
        encodeURIComponent('https://example.com') + '&cookieStoreId=firefox-container-1' +
        '&currentCookieStoreId=firefox-tmp-container-1';
      const fakeMAChangeInfo2 = {
        url: fakeMAUrl2
      };
      const fakeMATab2 = {
        id: fakeMATabId2,
        cookieStoreId: 'firefox-default',
        url: fakeMAUrl2
      };

      browser.tabs.remove.reset();
      const result4 = await background.tabsOnUpdated(fakeMATabId2, fakeMAChangeInfo2, fakeMATab2);

      expect(result4).to.be.undefined;
      browser.tabs.remove.should.not.have.been.called;
    });

    it('should leave the first confirm page open if openertab domain and clicked domain match (mac does not intervene with confirm page in this case)', async () => {
      // simulate click
      const fakeSender = {
        tab: {
          id: 123,
          cookieStoreId: 'firefox-tmp-container-123',
          url: 'https://notexample.com'
        }
      };
      const fakeMessage = {
        linkClicked: {
          href: 'https://example.com',
          event: {
            button: 1,
            ctrlKey: false
          }
        }
      };
      const background = await loadBackground();
      await background.runtimeOnMessage(fakeMessage, fakeSender);
      background.automaticModeState.linkClicked[fakeMessage.linkClicked.href].should.exist;

      // request comes in, we cancel it, close the tab and reopen in temp container
      const fakeRequest = {
        tabId: 1,
        url: 'https://example.com'
      };
      const fakeTab = {
        id: 1,
        openerTabId: 123,
        cookieStoreId: 'firefox-tmp-container-123'
      };
      const fakeCreatedTab = {
        id: 2,
        cookieStoreId: 'firefox-tmp-container-1'
      };
      const fakeContainer = {
        cookieStoreId: 'firefox-tmp-container-1'
      };
      browser.tabs.get.resolves(fakeTab);
      browser.contextualIdentities.create.resolves(fakeContainer);
      browser.tabs.create.resolves(fakeCreatedTab);
      const result1 = await background.request.webRequestOnBeforeRequest(fakeRequest);

      result1.should.deep.equal({cancel: true});
      browser.tabs.remove.should.have.been.calledWith(1);
      browser.contextualIdentities.create.should.have.been.calledOnce;
      browser.tabs.create.should.have.been.calledOnce;

      // the first request already triggered multi-account-containers
      // because the openertab and clicked link have the same domain, mac will not intervene on its own
      // so we can leave the MAC confirm page open
      const fakeMATabId = 3;
      const fakeMAUrl = 'moz-extension://multi-account-containers/confirm-page.html?url=' +
        encodeURIComponent('https://example.com') + '&cookieStoreId=firefox-container-1' +
        '&currentCookieStoreId=firefox-tmp-container-1';
      const fakeMAChangeInfo = {
        url: fakeMAUrl
      };
      const fakeMATab = {
        id: fakeMATabId,
        cookieStoreId: 'firefox-default',
        url: fakeMAUrl
      };

      browser.tabs.remove.reset();
      const result3 = await background.tabsOnUpdated(fakeMATabId, fakeMAChangeInfo, fakeMATab);

      expect(result3).to.be.undefined;
      browser.tabs.remove.should.not.have.been.called;
    });

    it('should close first confirm page and leave the second open even when MAC is *really* fast', async () => {
      // simulate click
      const fakeSender = {
        tab: {
          id: 123,
          cookieStoreId: 'firefox-tmp-container-1',
          url: 'https://notexample.com'
        }
      };
      const fakeMessage = {
        linkClicked: {
          href: 'https://example.com',
          event: {
            button: 1,
            ctrlKey: false
          }
        }
      };
      const background = await loadBackground();
      await background.runtimeOnMessage(fakeMessage, fakeSender);
      background.automaticModeState.linkClicked[fakeMessage.linkClicked.href].should.exist;


      // the first request already triggered multi-account-containers
      // it opened another tab that updates its url to moz-extension:// eventually
      // it also already removed our tab2
      // so we're now going to remove it
      const fakeMATabId = 3;
      const fakeMAUrl = 'moz-extension://multi-account-containers/confirm-page.html?url=' +
        encodeURIComponent('https://example.com') + '&cookieStoreId=firefox-container-1&currentCookieStoreId=firefox-tmp-container-1';
      const fakeMAChangeInfo = {
        url: fakeMAUrl
      };
      const fakeMATab = {
        id: fakeMATabId,
        cookieStoreId: 'firefox-tmp-container-1',
        url: fakeMAUrl
      };

      browser.tabs.remove.reset();
      const result3 = await background.tabsOnUpdated(fakeMATabId, fakeMAChangeInfo, fakeMATab);

      expect(result3).to.be.undefined;
      browser.tabs.remove.should.have.been.calledWith(3);


      // request comes in, MAC closed the related tab already
      const fakeRequest = {
        tabId: 1,
        url: 'https://example.com'
      };
      const fakeCreatedTab = {
        id: 2,
        cookieStoreId: 'firefox-tmp-container-1'
      };
      const fakeContainer = {
        cookieStoreId: 'firefox-tmp-container-1'
      };
      browser.tabs.get.rejects({mac: 'was faster'});
      browser.contextualIdentities.create.resolves(fakeContainer);
      browser.tabs.create.resolves(fakeCreatedTab);
      const result1 = await background.request.webRequestOnBeforeRequest(fakeRequest);

      result1.should.deep.equal({cancel: true});
      browser.tabs.remove.should.have.been.calledWith(1);
      browser.contextualIdentities.create.should.have.been.calledOnce;
      browser.tabs.create.should.have.been.calledOnce;

      // the tab 2 we opened now makes its request
      // should normally go through (hence we do nothing)
      const fakeRequest2 = {
        tabId: 2,
        url: 'https://example.com'
      };
      const fakeTab2 = {
        id: 2,
        cookieStoreId: 'firefox-tmp-container-1'
      };
      browser.contextualIdentities.create.reset();
      browser.tabs.create.reset();
      browser.tabs.get.resolves(fakeTab2);
      const result2 = await background.request.webRequestOnBeforeRequest(fakeRequest2);

      expect(result2).to.be.undefined;
      browser.contextualIdentities.create.should.not.have.been.called;
      browser.tabs.create.should.not.have.been.called;

      // tab 2 opening the url in another container triggered multi-account-containers again
      // but this time its ok and we should leave the confirm page open
      const fakeMATabId2 = 3;
      const fakeMAUrl2 = 'moz-extension://multi-account-containers/confirm-page.html?url=' +
        encodeURIComponent('https://example.com') + '&cookieStoreId=firefox-container-1' +
        '&currentCookieStoreId=firefox-tmp-container-1';
      const fakeMAChangeInfo2 = {
        url: fakeMAUrl2
      };
      const fakeMATab2 = {
        id: fakeMATabId2,
        cookieStoreId: 'firefox-default',
        url: fakeMAUrl2
      };

      browser.tabs.remove.reset();
      const result4 = await background.tabsOnUpdated(fakeMATabId2, fakeMAChangeInfo2, fakeMATab2);

      expect(result4).to.be.undefined;
      browser.tabs.remove.should.not.have.been.called;
    });

    it('should handle situations were mac is even faster than fast', async () => {
      // simulate click
      const fakeSender = {
        tab: {
          id: 3,
          cookieStoreId: 'firefox-tmp-container-6',
          url: 'https://notexample.com'
        }
      };
      const fakeMessage = {
        linkClicked: {
          href: 'https://example.com',
          event: {
            button: 1,
            ctrlKey: false
          }
        }
      };
      const background = await loadBackground();
      await background.runtimeOnMessage(fakeMessage, fakeSender);
      background.automaticModeState.linkClicked[fakeMessage.linkClicked.href].should.exist;


      // the first request already triggered multi-account-containers
      // it opened another tab that updates its url to moz-extension:// eventually
      // it also already removed our tab2
      // so we're now going to remove it
      const fakeMATabId = 5;
      const fakeMAUrl = 'moz-extension://multi-account-containers/confirm-page.html?url=' +
        encodeURIComponent('https://example.com') + '&cookieStoreId=firefox-ma-container-1&currentCookieStoreId=firefox-tmp-container-6';
      const fakeMAChangeInfo = {
        url: fakeMAUrl
      };
      const fakeMATab = {
        id: fakeMATabId,
        cookieStoreId: 'firefox-tmp-container-6',
        url: fakeMAUrl
      };

      browser.tabs.remove.reset();
      const result3 = await background.tabsOnUpdated(fakeMATabId, fakeMAChangeInfo, fakeMATab);

      expect(result3).to.be.undefined;
      browser.tabs.remove.should.have.been.calledWith(5);


      // request comes in, MAC closed the related tab already
      // this is was probably created in firefox-tmp-container-6, hence we want to close it
      const fakeRequest = {
        tabId: 4,
        url: 'https://example.com'
      };
      const fakeCreatedTab = {
        id: 6,
        cookieStoreId: 'firefox-tmp-container-7'
      };
      const fakeContainer = {
        cookieStoreId: 'firefox-tmp-container-7'
      };
      browser.tabs.get.rejects({mac: 'was faster'});
      browser.contextualIdentities.create.resolves(fakeContainer);
      browser.tabs.create.resolves(fakeCreatedTab);
      const result1 = await background.request.webRequestOnBeforeRequest(fakeRequest);

      result1.should.deep.equal({cancel: true});
      browser.tabs.remove.should.have.been.calledWith(4);
      browser.contextualIdentities.create.should.have.been.calledOnce;
      browser.tabs.create.should.have.been.calledOnce;

      // the tab 2 we opened now makes its request
      // should normally go through (hence we do nothing)
      const fakeRequest2 = {
        tabId: 2,
        url: 'https://example.com'
      };
      const fakeTab2 = {
        id: 2,
        cookieStoreId: 'firefox-tmp-container-1'
      };
      browser.contextualIdentities.create.reset();
      browser.tabs.create.reset();
      browser.tabs.get.resolves(fakeTab2);
      const result2 = await background.request.webRequestOnBeforeRequest(fakeRequest2);

      expect(result2).to.be.undefined;
      browser.contextualIdentities.create.should.not.have.been.called;
      browser.tabs.create.should.not.have.been.called;

      // tab 2 opening the url in another container triggered multi-account-containers again
      // but this time its ok and we should leave the confirm page open
      const fakeMATabId2 = 7;
      const fakeMAUrl2 = 'moz-extension://multi-account-containers/confirm-page.html?url=' +
        encodeURIComponent('https://example.com') + '&cookieStoreId=firefox-ma-container-1' +
        '&currentCookieStoreId=firefox-tmp-container-7';
      const fakeMAChangeInfo2 = {
        url: fakeMAUrl2
      };
      const fakeMATab2 = {
        id: fakeMATabId2,
        cookieStoreId: 'firefox-tmp-container-7',
        url: fakeMAUrl2
      };

      browser.tabs.remove.reset();
      const result4 = await background.tabsOnUpdated(fakeMATabId2, fakeMAChangeInfo2, fakeMATab2);

      expect(result4).to.be.undefined;
      browser.tabs.remove.should.not.have.been.called;

      // now comes request from tab 6 that was already closed from MAC
      // we should open another tab so that the confirm page gives choice
      // between the new temporary container or the "always open target"
      const fakeRequest3 = {
        tabId: 6,
        url: 'https://example.com'
      };
      const fakeCreatedTab3 = {
        id: 7,
        cookieStoreId: 'firefox-tmp-container-8'
      };
      const fakeContainer3 = {
        cookieStoreId: 'firefox-tmp-container-8'
      };
      browser.tabs.get.rejects({mac: 'was faster'});
      browser.contextualIdentities.create.resolves(fakeContainer3);
      browser.tabs.create.resolves(fakeCreatedTab3);
      const result5 = await background.request.webRequestOnBeforeRequest(fakeRequest3);

      result5.should.deep.equal({cancel: true});
      browser.tabs.remove.should.have.been.calledWith(6);
      browser.contextualIdentities.create.should.have.been.calledOnce;
      browser.tabs.create.should.have.been.calledOnce;
    });
  });

  describe('when previously clicked url loads thats set to "always open in $container" and "remember my choice"', () => {
    it('should close the first tab and leave the second open', async () => {
      // simulate click
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
            button: 1,
            ctrlKey: false
          }
        }
      };
      const background = await loadBackground();
      await background.runtimeOnMessage(fakeMessage, fakeSender);
      background.automaticModeState.linkClicked[fakeMessage.linkClicked.href].should.exist;

      // click created tab 2 which results in this request
      // this should close tab 2 and create a new tab 4
      const fakeRequest = {
        tabId: 2,
        url: 'https://example.com'
      };
      const fakeTab = {
        id: 2,
        cookieStoreId: 'firefox-tmp-container-1',
        openerTabId: 1
      };
      const fakeContainer = {
        cookieStoreId: 'firefox-tmp-container-2'
      };
      browser.tabs.get.resolves(fakeTab);
      browser.contextualIdentities.create.resolves(fakeContainer);
      browser.tabs.create.resolves(fakeTab);
      const result1 = await background.request.webRequestOnBeforeRequest(fakeRequest);

      result1.should.deep.equal({cancel: true});
      browser.contextualIdentities.create.should.have.been.calledOnce;
      browser.tabs.create.should.have.been.calledOnce;
      browser.tabs.remove.should.have.been.calledWith(2);

      // multi-account-containers saw the same request
      // canceled the request, closed tab 2, created its own tab 3
      // and that results in this request
      // which in turn should be detected as MA request, canceled and tab closed
      const fakeMultiAccountRequest = {
        tabId: 3,
        url: 'https://example.com'
      };
      const fakeMultiAccountTab = {
        id: 3,
        cookieStoreId: 'firefox-ma-container-1'
      };
      browser.tabs.get.resolves(fakeMultiAccountTab);
      browser.tabs.remove.reset();
      await background.request.webRequestOnBeforeRequest(fakeMultiAccountRequest);

      browser.tabs.remove.should.have.been.calledOnce;
      browser.tabs.remove.should.have.been.calledWith(3);

      // the tab 4 now comes through with its request
      // this should go through even though its gonna be intercepted by MA again
      const fakeRequest2 = {
        tabId: 4,
        url: 'https://example.com'
      };
      const fakeTab2 = {
        id: 4,
        cookieStoreId: 'firefox-tmp-container-2'
      };
      browser.tabs.get.resolves(fakeTab2);
      browser.tabs.remove.reset();
      const result2 = await background.request.webRequestOnBeforeRequest(fakeRequest2);

      expect(result2).to.be.undefined;
      browser.tabs.remove.should.not.have.been.called;

      // the tab 4 request triggered MA and here's that request
      // it should go through and not be closed
      const fakeMultiAccountRequest2 = {
        tabId: 5,
        url: 'https://example.com'
      };
      const fakeMultiAccountTab2 = {
        id: 5,
        cookieStoreId: 'firefox-ma-container-1'
      };
      browser.tabs.get.resolves(fakeMultiAccountTab2);
      browser.tabs.remove.reset();
      await background.request.webRequestOnBeforeRequest(fakeMultiAccountRequest2);

      browser.tabs.remove.should.not.have.been.called;
    });

    it('should not keep opening tabs', async () => {
      // simulate click
      const fakeSender = {
        tab: {
          id: 40,
          cookieStoreId: 'firefox-tmp-container-7',
          url: 'https://notexample.com'
        }
      };
      const fakeMessage = {
        linkClicked: {
          href: 'https://example.com',
          event: {
            button: 1,
            ctrlKey: false
          }
        }
      };
      const background = await loadBackground();
      await background.runtimeOnMessage(fakeMessage, fakeSender);
      background.automaticModeState.linkClicked[fakeMessage.linkClicked.href].should.exist;

      // click created tab 41 which results in this request
      // MAC was really fast and removed the tab already
      // so we can't get informations for tab41
      // means there's no need to cancel the request
      // we also don't want to create a new tab, MAC is already doing that
      // TODO: why do we try to remove it anyway?
      const fakeRequest = {
        tabId: 41,
        url: 'https://example.com'
      };
      const fakeTab = {
        id: 43,
        cookieStoreId: 'firefox-tmp-container-7'
      };
      const fakeContainer = {
        cookieStoreId: 'firefox-tmp-container-7'
      };
      browser.tabs.get.rejects({mac: 'was faster'});
      browser.contextualIdentities.create.resolves(fakeContainer);
      browser.tabs.create.resolves(fakeTab);
      const result1 = await background.request.webRequestOnBeforeRequest(fakeRequest);

      expect(result1).to.be.undefined;
      browser.contextualIdentities.create.should.not.have.been.calledOnce;
      browser.tabs.create.should.not.have.been.called;


      // this time we're faster than mac, the tab 43 already comes through with its request
      // this should go through even though its gonna be intercepted by MA again
      const fakeRequest2 = {
        tabId: 43,
        url: 'https://example.com'
      };
      const fakeTab2 = {
        id: 43,
        cookieStoreId: 'firefox-tmp-container-7'
      };
      browser.tabs.get.resolves(fakeTab2);
      browser.tabs.remove.reset();
      const result2 = await background.request.webRequestOnBeforeRequest(fakeRequest2);

      expect(result2).to.be.undefined;
      browser.tabs.remove.should.not.have.been.called;


      // multi-account-containers saw the request from tab 41 and 43 and does two requests now
      // canceled the request, closed tab 41, created its own tabs 44 and 42
      // and that results in this request for tab 44 before tab 42, which isnt too bad because
      // it doesnt really matter which one we close
      // it should get detected as MA request anyhow, canceled and tab closed
      const fakeMultiAccountRequest = {
        tabId: 44,
        url: 'https://example.com'
      };
      const fakeMultiAccountTab = {
        id: 44,
        cookieStoreId: 'firefox-ma-container-1'
      };
      browser.tabs.get.resolves(fakeMultiAccountTab);
      browser.tabs.remove.reset();
      await background.request.webRequestOnBeforeRequest(fakeMultiAccountRequest);

      browser.tabs.remove.should.have.been.called;


      // the tab 43 request triggered MA and here's that request
      // it should go through and not be closed
      const fakeMultiAccountRequest2 = {
        tabId: 42,
        url: 'https://example.com'
      };
      const fakeMultiAccountTab2 = {
        id: 42,
        cookieStoreId: 'firefox-ma-container-1'
      };
      browser.tabs.get.resolves(fakeMultiAccountTab2);
      browser.tabs.remove.reset();
      browser.tabs.create.reset();
      await background.request.webRequestOnBeforeRequest(fakeMultiAccountRequest2);

      browser.tabs.remove.should.not.have.been.called;
      browser.tabs.create.should.not.have.been.called;
    });

    it('should not keep opening tabs (firefox58)', async () => {
      // simulate click
      const fakeSender = {
        tab: {
          id: 40,
          cookieStoreId: 'firefox-tmp-container-7',
          url: 'https://notexample.com'
        }
      };
      const fakeMessage = {
        linkClicked: {
          href: 'https://example.com',
          event: {
            button: 1,
            ctrlKey: false
          }
        }
      };
      const background = await loadBackground();
      await background.runtimeOnMessage(fakeMessage, fakeSender);
      background.automaticModeState.linkClicked[fakeMessage.linkClicked.href].should.exist;

      // click created tab 41 which results in this request
      // mac didnt remove the tab already, so we have to proceed as if nothing happened
      // we create tab 59
      const fakeRequest = {
        tabId: 41,
        url: 'https://example.com'
      };
      const fakeRequestTab = {
        id: 42,
        cookieStoreId: 'firefox-ma-container-1',
        openerTabId: 40
      };
      const fakeTab = {
        id: 59,
        cookieStoreId: 'firefox-tmp-container-131'
      };
      const fakeContainer = {
        cookieStoreId: 'firefox-tmp-container-131'
      };
      browser.tabs.get.resolves(fakeRequestTab);
      browser.contextualIdentities.create.resolves(fakeContainer);
      browser.tabs.create.resolves(fakeTab);
      const result1 = await background.request.webRequestOnBeforeRequest(fakeRequest);

      result1.should.deep.equal({cancel: true});
      browser.contextualIdentities.create.should.have.been.called;
      browser.tabs.create.should.have.been.called;


      // now we see two requests rapidly
      // request from the tab 59 we created (mac was fast and already removed that tab)
      // we should cancel and remove
      const fakeRequest2 = {
        tabId: 59,
        url: 'https://example.com'
      };
      browser.tabs.get.rejects({mac: 'was faster'});
      browser.tabs.remove.reset();
      browser.tabs.create.reset();
      browser.contextualIdentities.create.reset();
      background.request.webRequestOnBeforeRequest(fakeRequest2);

      // request from mac (tab60) that intervenes
      // we remove but dont open new tab
      const fakeMultiAccountRequest = {
        tabId: 60,
        url: 'https://example.com'
      };
      const fakeMultiAccountTab = {
        id: 60,
        cookieStoreId: 'firefox-ma-container-1'
      };
      browser.tabs.get.resolves(fakeMultiAccountTab);
      browser.tabs.remove.reset();
      await background.request.webRequestOnBeforeRequest(fakeMultiAccountRequest);

      await (new Promise(r => process.nextTick(r)));
      browser.tabs.remove.should.have.been.calledWith(59);
      browser.tabs.remove.should.have.been.calledWith(60);
      browser.tabs.create.should.not.have.been.called;
      browser.contextualIdentities.create.should.not.have.been.called;

      // request from mac (tab61) that intervenes
      // we dont remove and dont open new tab
      const fakeMultiAccountRequest2 = {
        tabId: 61,
        url: 'https://example.com'
      };
      const fakeMultiAccountTab2 = {
        id: 61,
        cookieStoreId: 'firefox-ma-container-1'
      };
      browser.tabs.get.resolves(fakeMultiAccountTab2);
      browser.tabs.remove.reset();
      browser.tabs.create.reset();
      browser.contextualIdentities.create.reset();
      await background.request.webRequestOnBeforeRequest(fakeMultiAccountRequest2);

      browser.tabs.remove.should.not.have.been.called;
      browser.tabs.create.should.not.have.been.called;
      browser.contextualIdentities.create.should.not.have.been.called;

    });
  });

  describe('when not previously clicked url loads thats set to "always open in $container" and "remember my choice"', () => {
    it('should close the first tab and leave the second open', async () => {
      // request comes in but MAC was faster and removed the tab already
      // this should try to close the tab and create a new tab
      // it would be nicer to just let it be at this point and not open a new tab
      // but there's no reliable way of guessing that MAC already opened a tab
      // with that url and without a confirm page
      const fakeRequest = {
        tabId: 1,
        url: 'https://example.com'
      };
      const fakeTab = {
        id: 2,
        cookieStoreId: 'firefox-tmp-container-1'
      };
      const fakeContainer = {
        cookieStoreId: 'firefox-tmp-container-1'
      };
      browser.tabs.get.rejects({mac: 'was faster'});
      browser.contextualIdentities.create.resolves(fakeContainer);
      browser.tabs.create.resolves(fakeTab);
      const background = await loadBackground();
      const result1 = await background.request.webRequestOnBeforeRequest(fakeRequest);

      result1.should.deep.equal({cancel: true});
      browser.contextualIdentities.create.should.have.been.calledOnce;
      browser.tabs.create.should.have.been.calledOnce;
      browser.tabs.remove.should.have.been.calledWith(1);


      // the created tab 2 now comes through with its request
      // MAC was fast again and the tab doesn't exist anymore
      // this should go through and not reopen in temp container
      const fakeRequest2 = {
        tabId: 2,
        url: 'https://example.com'
      };
      browser.tabs.get.rejects({mac: 'was faster'});
      browser.tabs.remove.reset();
      browser.tabs.create.reset();
      const result2 = await background.request.webRequestOnBeforeRequest(fakeRequest2);

      expect(result2).to.be.undefined;
      browser.tabs.create.should.have.not.been.calledOnce;
      browser.tabs.remove.should.not.have.been.called;


      // multi-account-containers saw the same request
      // canceled the request, closed tab 2, created its own tab 3
      // and that results in this request
      // which in turn should be detected as MA request, canceled and tab closed
      const fakeMultiAccountRequest = {
        tabId: 3,
        url: 'https://example.com'
      };
      const fakeMultiAccountTab = {
        id: 3,
        cookieStoreId: 'firefox-ma-container-1'
      };
      browser.tabs.get.resolves(fakeMultiAccountTab);
      browser.tabs.remove.reset();
      await background.request.webRequestOnBeforeRequest(fakeMultiAccountRequest);

      browser.tabs.remove.should.have.been.calledOnce;
      browser.tabs.remove.should.have.been.calledWith(3);

      // the tab 4 request triggered MA and here's that request
      // it should go through and not be closed
      const fakeMultiAccountRequest2 = {
        tabId: 5,
        url: 'https://example.com'
      };
      const fakeMultiAccountTab2 = {
        id: 5,
        cookieStoreId: 'firefox-ma-container-1'
      };
      browser.tabs.get.resolves(fakeMultiAccountTab2);
      browser.tabs.remove.reset();
      await background.request.webRequestOnBeforeRequest(fakeMultiAccountRequest2);

      browser.tabs.remove.should.not.have.been.called;
    });

    it('should close the first tab and really leave the second open', async () => {
      // request comes in but MAC was faster and removed the tab already
      // this should try to close the tab and create a new tab
      const fakeRequest = {
        tabId: 1,
        url: 'https://example.com'
      };
      const fakeTab = {
        id: 2,
        cookieStoreId: 'firefox-tmp-container-1'
      };
      const fakeContainer = {
        cookieStoreId: 'firefox-tmp-container-1'
      };
      browser.tabs.get.rejects({mac: 'was faster'});
      browser.contextualIdentities.create.resolves(fakeContainer);
      browser.tabs.create.resolves(fakeTab);
      const background = await loadBackground();
      const result1 = await background.request.webRequestOnBeforeRequest(fakeRequest);

      result1.should.deep.equal({cancel: true});
      browser.contextualIdentities.create.should.have.been.calledOnce;
      browser.tabs.create.should.have.been.calledOnce;
      browser.tabs.remove.should.have.been.calledWith(1);


      // multi-account-containers saw the same request
      // canceled the request, closed tab 2, created its own tab 3
      // and that results in this request
      // which in turn should be detected as MA request, canceled and tab closed
      const fakeMultiAccountRequest = {
        tabId: 3,
        url: 'https://example.com'
      };
      const fakeMultiAccountTab = {
        id: 3,
        cookieStoreId: 'firefox-ma-container-1'
      };
      browser.tabs.get.resolves(fakeMultiAccountTab);
      browser.tabs.remove.reset();
      await background.request.webRequestOnBeforeRequest(fakeMultiAccountRequest);

      browser.tabs.remove.should.have.been.calledOnce;
      browser.tabs.remove.should.have.been.calledWith(3);


      // the created tab 2 now comes through with its request
      // MAC was fast again and the tab doesn't exist anymore
      // this should go through and not reopen in temp container
      const fakeRequest2 = {
        tabId: 2,
        url: 'https://example.com'
      };
      browser.tabs.get.rejects({mac: 'was faster'});
      browser.tabs.remove.reset();
      browser.tabs.create.reset();
      const result2 = await background.request.webRequestOnBeforeRequest(fakeRequest2);

      expect(result2).to.be.undefined;
      browser.tabs.create.should.have.not.been.calledOnce;
      browser.tabs.remove.should.not.have.been.called;


      // the tab 4 request triggered MA and here's that request
      // it should go through and not be closed
      const fakeMultiAccountRequest2 = {
        tabId: 5,
        url: 'https://example.com'
      };
      const fakeMultiAccountTab2 = {
        id: 5,
        cookieStoreId: 'firefox-ma-container-1'
      };
      browser.tabs.get.resolves(fakeMultiAccountTab2);
      browser.tabs.remove.reset();
      await background.request.webRequestOnBeforeRequest(fakeMultiAccountRequest2);

      browser.tabs.remove.should.not.have.been.called;
    });

    it('should close the first tab and leave the second open even when requests come in rapidly', async () => {
      // issue:
      // 1) open example.com in tab 44 in firefox-container-37
      // 2) MAC intervenes, closes tab 44, creates tab 45 in firefox-container-1
      // 3) tab 44 request comes in and we assume firefox-default container at this point
      //    because we can't get info about the tab anymore
      //    therefore we want to reopen the tab in a temporary container
      //    creating tab 46 for example.com in firefox-container-38
      // 4) MAC intervenes again, closes tab 46 and creates tab 47 with example.com in firefox-container-1
      // 5) request for tab 46 comes in
      // 6) request for tab 45 comes in
      // 7) request for tab 47 comes in
      // 8) MAC tabs 45 & 47 get closed - no tabs left.

      // request comes in but MAC was faster and removed the tab already
      // this should try to close the tab and create a new tab
      const fakeRequest = {
        tabId: 44,
        url: 'https://example.com'
      };
      const fakeTab = {
        id: 46,
        cookieStoreId: 'firefox-tmp-container-38'
      };
      const fakeContainer = {
        cookieStoreId: 'firefox-tmp-container-38'
      };
      browser.tabs.get.rejects({mac: 'was faster'});
      browser.contextualIdentities.create.resolves(fakeContainer);
      browser.tabs.create.resolves(fakeTab);
      const background = await loadBackground();
      const result1 = await background.request.webRequestOnBeforeRequest(fakeRequest);

      result1.should.deep.equal({cancel: true});
      browser.contextualIdentities.create.should.have.been.calledOnce;
      browser.tabs.create.should.have.been.calledOnce;
      browser.tabs.remove.should.have.been.calledWith(44);

      // the created tab 46 now comes through with its request
      // MAC was fast again and the tab doesn't exist anymore
      // this should go through and not reopen in temp container
      const fakeRequest2 = {
        tabId: 46,
        url: 'https://example.com'
      };
      browser.tabs.get.rejects({mac: 'was faster'});
      background.request.webRequestOnBeforeRequest(fakeRequest2);

      // multi-account-containers saw the same request
      // canceled the request, closed tab 2, created its own tab 3
      // and that results in this request
      // which in turn should be detected as MA request, canceled and tab closed
      const fakeMultiAccountRequest = {
        tabId: 45,
        url: 'https://example.com'
      };
      const fakeMultiAccountTab = {
        id: 45,
        cookieStoreId: 'firefox-ma-container-1'
      };
      browser.tabs.get.resolves(fakeMultiAccountTab);
      browser.tabs.remove.reset();
      background.request.webRequestOnBeforeRequest(fakeMultiAccountRequest);

      // the tab 4 request triggered MA and here's that request
      // it should go through and not be closed
      const fakeMultiAccountRequest2 = {
        tabId: 47,
        url: 'https://example.com'
      };
      const fakeMultiAccountTab2 = {
        id: 47,
        cookieStoreId: 'firefox-ma-container-1'
      };
      browser.tabs.get.resolves(fakeMultiAccountTab2);
      await background.request.webRequestOnBeforeRequest(fakeMultiAccountRequest2);

      browser.tabs.remove.should.have.been.calledOnce;
      browser.tabs.remove.should.have.been.calledWith(45);
    });

    it('should close the first tab and really leave the second open even when requests come in rapidly', async () => {
      // request 1
      // gets canceled by MAC
      const fakeRequest = {
        tabId: 1,
        url: 'https://example.com'
      };
      const fakeTab = {
        id: 1,
        cookieStoreId: 'firefox-tmp-container-1'
      };
      browser.tabs.get.resolves(fakeTab);
      const background = await loadBackground();
      background.storage.local.tempContainers['firefox-tmp-container-1'] = true;
      background.request.webRequestOnBeforeRequest(fakeRequest);

      // request 2
      // from tab 2 created by MAC
      const fakeRequest2 = {
        tabId: 2,
        url: 'https://example.com'
      };
      const fakeTab2 = {
        id: 2,
        cookieStoreId: 'firefox-ma-container-1'
      };
      browser.tabs.get.resolves(fakeTab2);
      background.request.webRequestOnBeforeRequest(fakeRequest2);

      await new Promise(r => process.nextTick(r));

      browser.tabs.remove.should.not.have.been.called;
    });
  });
});
