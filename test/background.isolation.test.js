preferencesTestSet.map(preferences => { describe(`preferences: ${JSON.stringify(preferences)}`, () => {
  let tab;

  [
    'sametab',
    'newtab'
  ].map(navigatingIn => { describe(`navigatingIn: ${navigatingIn}`, () => {

    const navigateTo = async (url) => {
      switch (navigatingIn) {
      case 'sametab':
        await browser.tabs.update(tab.id, {
          url
        });
        break;

      case 'newtab':
        await browser.tabs.create({
          openerTabId: tab.id,
          url
        });
        break;
      }
    };

    describe('Isolation', () => {
      beforeEach(async () => {
        const background = await loadBareBackground(preferences, {apiFake: true});
        await background.initialize();
        tab = await browser.tabs.create({
          active: true,
          url: 'https://example.com'
        });
        browser.tabs.create.resetHistory();
      });

      describe('navigating with preference "never"', () => {
        beforeEach(async () => {
          background.storage.local.preferences.isolationGlobal = 'never';
        });

        describe('if its the exact same domain', () => {
          beforeEach(async () => {
            await navigateTo('https://example.com/moo');
          });

          it('should not open a new Temporary Container', async () => {
            switch (navigatingIn) {
            case 'sametab':
              browser.tabs.create.should.not.have.been.called;
              break;
            case 'newtab':
              browser.tabs.create.should.have.been.calledOnce;
              break;
            }
          });
        });

        describe('if its the same domain', () => {
          beforeEach(async () => {
            await navigateTo('https://sub.example.com');
          });

          it('should not open a new Temporary Container', async () => {
            switch (navigatingIn) {
            case 'sametab':
              browser.tabs.create.should.not.have.been.called;
              break;
            case 'newtab':
              browser.tabs.create.should.have.been.calledOnce;
              break;
            }
          });
        });

        describe('if its not the same domain', () => {
          beforeEach(async () => {
            await navigateTo('https://notexample.com');
          });

          it('should not open a new Temporary Container', async () => {
            switch (navigatingIn) {
            case 'sametab':
              browser.tabs.create.should.not.have.been.called;
              break;
            case 'newtab':
              browser.tabs.create.should.have.been.calledOnce;
              break;
            }
          });
        });
      });

      describe('navigating with preference "always"', () => {
        beforeEach(async () => {
          background.storage.local.preferences.isolationGlobal = 'always';
        });

        describe('if its the exact same domain', () => {
          beforeEach(async () => {
            await navigateTo('https://example.com/moo');
          });

          it('should open a new Temporary Container', async () => {
            switch (navigatingIn) {
            case 'sametab':
              browser.tabs.create.should.have.been.calledOnce;
              break;
            case 'newtab':
              browser.tabs.create.should.have.been.calledTwice;
              break;
            }
          });
        });

        describe('if its the same domain', () => {
          beforeEach(async () => {
            await navigateTo('https://sub.example.com');
          });

          it('should open a new Temporary Container', async () => {
            switch (navigatingIn) {
            case 'sametab':
              browser.tabs.create.should.have.been.calledOnce;
              break;
            case 'newtab':
              browser.tabs.create.should.have.been.calledTwice;
              break;
            }
          });
        });

        describe('if its not the same domain', () => {
          beforeEach(async () => {
            await navigateTo('https://notexample.com');
          });

          it('should open a new Temporary Container', async () => {
            switch (navigatingIn) {
            case 'sametab':
              browser.tabs.create.should.have.been.calledOnce;
              break;
            case 'newtab':
              browser.tabs.create.should.have.been.calledTwice;
              break;
            }
          });
        });
      });

      describe('navigating with preference "notsamedomain"', () => {
        beforeEach(() => {
          background.storage.local.preferences.isolationGlobal = 'notsamedomain';
        });

        describe('if its the exact same domain', () => {
          beforeEach(async () => {
            await navigateTo('https://example.com/moo');
          });

          it('should not open a new Temporary Container', async () => {
            switch (navigatingIn) {
            case 'sametab':
              browser.tabs.create.should.not.have.been.called;
              break;
            case 'newtab':
              browser.tabs.create.should.have.been.calledOnce;
              break;
            }
          });
        });

        describe('if its the same domain', () => {
          beforeEach(async () => {
            await navigateTo('https://sub.example.com');
          });

          it('should not open a new Temporary Container', async () => {
            switch (navigatingIn) {
            case 'sametab':
              browser.tabs.create.should.not.have.been.called;
              break;
            case 'newtab':
              browser.tabs.create.should.have.been.calledOnce;
              break;
            }
          });
        });

        describe('if its not the same domain', () => {
          beforeEach(async () => {
            await navigateTo('https://notexample.com');
          });

          it('should open a new Temporary Container', async () => {
            switch (navigatingIn) {
            case 'sametab':
              browser.tabs.create.should.have.been.calledOnce;
              break;
            case 'newtab':
              browser.tabs.create.should.have.been.calledTwice;
              break;
            }
          });
        });
      });

      describe('navigating with preference "notsamedomainexact"', () => {
        beforeEach(() => {
          background.storage.local.preferences.isolationGlobal = 'notsamedomainexact';
        });

        describe('if its the exact same domain', () => {
          beforeEach(async () => {
            await navigateTo('https://example.com/moo');
          });

          it('should not open a new Temporary Container', async () => {
            switch (navigatingIn) {
            case 'sametab':
              browser.tabs.create.should.not.have.been.called;
              break;
            case 'newtab':
              browser.tabs.create.should.have.been.calledOnce;
              break;
            }
          });
        });

        describe('if its the same domain', () => {
          beforeEach(async () => {
            await navigateTo('https://sub.example.com');
          });

          it('should open a new Temporary Container', async () => {
            switch (navigatingIn) {
            case 'sametab':
              browser.tabs.create.should.have.been.calledOnce;
              break;
            case 'newtab':
              browser.tabs.create.should.have.been.calledTwice;
              break;
            }
          });
        });

        describe('if its not the same domain', () => {
          beforeEach(async () => {
            await navigateTo('https://notexample.com');
          });

          it('should open a new Temporary Container', async () => {
            switch (navigatingIn) {
            case 'sametab':
              browser.tabs.create.should.have.been.calledOnce;
              break;
            case 'newtab':
              browser.tabs.create.should.have.been.calledTwice;
              break;
            }
          });
        });
      });
    });


    describe('Multi-Account Containers Isolation', () => {
      beforeEach(async () => {
        const background = await loadBareBackground(preferences, {apiFake: true});
        await background.initialize();
        tab = await browser.tabs.create({
          active: true,
          url: 'https://example.com',
          cookieStoreId: 'firefox-container-1'
        });
        browser.tabs.create.resetHistory();
      });

      describe('navigating with "enabled"', () => {
        beforeEach(async () => {
          background.storage.local.preferences.isolationMac = 'enabled';
        });
        describe('if the navigation target is assigned to the current container', () => {
          beforeEach(async () => {
            browser.runtime.sendMessage.resolves({
              userContextId: '1',
              neverAsk: false
            });
            await navigateTo('https://assigned.com');
          });

          it('should not open a new Temporary Container', () => {
            switch (navigatingIn) {
            case 'sametab':
              browser.tabs.create.should.not.have.been.called;
              break;
            case 'newtab':
              browser.tabs.create.should.have.been.calledOnce;
              break;
            }
          });
        });

        describe('if the navigation target isnt assigned to the current container', () => {
          beforeEach(async () => {
            browser.runtime.sendMessage.resolves(null);
            await navigateTo('https://notassigned.com');
          });

          it('should open a new Temporary Container', () => {
            switch (navigatingIn) {
            case 'sametab':
              browser.tabs.create.should.have.been.calledOnce;
              break;
            case 'newtab':
              browser.tabs.create.should.have.been.calledTwice;
              break;
            }
          });
        });

      });
    });
  });});
});});