preferencesTestSet.map(preferences => { describe(`preferences: ${JSON.stringify(preferences)}`, () => {

  describe('Set Cookies', () => {
    it('should set the cookie and add it to the header if allowed', async () => {
      const background = await loadBackground(preferences);
      await helper.browser.openNewTmpTab({
        createsContainer: 'firefox-tmp1'
      });
      const cookie = {
        domain: 'domain',
        expirationDate: 123,
        httpOnly: 'true',
        name: 'name',
        path: '/foo/bar',
        secure: 'true',
        url: 'https://example.com',
        value: 'value'
      };
      browser.cookies.get.resolves(cookie);
      background.storage.local.preferences.setCookiesDomain = {
        'example.com': [cookie]
      };
      const [promise] = browser.webRequest.onBeforeSendHeaders.addListener.yield({
        url: 'https://example.com',
        requestHeaders: [
          {name: 'Cookie', value: 'foo=bar; moo=foo'}
        ]
      });
      const result = await promise;
      browser.cookies.set.should.have.been.calledWith({
        domain: 'domain',
        expirationDate: 123,
        httpOnly: true,
        name: 'name',
        path: '/foo/bar',
        secure: true,
        url: 'https://example.com',
        value: 'value',
        storeId: 'firefox-tmp1'
      });
      result.should.deep.equal({
        url: 'https://example.com',
        requestHeaders: [
          {name: 'Cookie', value: 'foo=bar; moo=foo; name=value'}
        ]
      });
    });

    it('should set the cookie and not add it to the header if not allowed', async () => {
      const background = await loadBackground(preferences);
      await helper.browser.openNewTmpTab({
        createsContainer: 'firefox-tmp1'
      });
      const cookie = {
        domain: 'domain',
        expirationDate: 123,
        httpOnly: 'true',
        name: 'name',
        path: '/foo/bar',
        secure: 'true',
        url: 'https://example.com',
        value: 'value'
      };
      browser.cookies.get.resolves(null);
      background.storage.local.preferences.setCookiesDomain = {
        'example.com': [cookie]
      };
      const [promise] = browser.webRequest.onBeforeSendHeaders.addListener.yield({
        tabId: 1,
        url: 'https://example.com',
        requestHeaders: [
          {name: 'Cookie', value: 'foo=bar; moo=foo'}
        ]
      });
      const result = await promise;
      browser.cookies.set.should.have.been.called;
      expect(result).to.be.undefined;
    });

    it('should do nothing if its not a temporary container', async () => {
      const background = await loadBareBackground(preferences);
      browser.tabs.get.resolves({
        cookieStoreId: 'firefox-default'
      });
      await background.initialize();
      background.storage.local.preferences.setCookiesDomain = {
        'example.com': [
          {name: 'example', value: 'content'}
        ]
      };
      const [response] = browser.webRequest.onBeforeSendHeaders.addListener.yield({
        url: 'https://example.com'
      });
      expect(await response).to.be.undefined;
    });
  });
});});