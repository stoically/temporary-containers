preferencesTestSet.map(preferences => { describe(`preferences: ${JSON.stringify(preferences)}`, () => {
  let background, tab;

  const defaultIsolationDomainPreferences = {
    always: {
      action: 'disabled',
      allowedInPermanent: false
    },
    navigation: {
      action: 'global'
    },
    mouseClick: {
      middle: {
        action: 'global'
      },
      ctrlleft: {
        action: 'global'
      },
      left: {
        action: 'global'
      }
    },
    excluded: {}
  };

  [
    'tmp',
    'permanent'
  ].map(originContainerType => { describe(`originContainerType: ${originContainerType}`, () => {
    [
      'sametab.global',
      'sametab.perdomain',
      'newtab.global',
      'newtab.perdomain'
    ].map(navigatingIn => { describe(`navigatingIn: ${navigatingIn}`, () => {

      const navigateTo = async (url) => {
        background.container.markUnclean(tab.id);

        switch (navigatingIn) {
        case 'sametab.global':
        case 'sametab.perdomain':
          return browser.tabs._update(tab.id, {
            url
          });

        case 'newtab.global':
        case 'newtab.perdomain':
          return browser.tabs._create({
            cookieStoreId: tab.cookieStoreId,
            openerTabId: tab.id,
            url
          });
        }
      };

      describe('Isolation', () => {
        beforeEach(async () => {
          background = await loadBareBackground(preferences, {apiFake: true});
          await background.initialize();
          const url = 'https://example.com';
          if (originContainerType === 'permanent') {
            tab = await browser.tabs._create({
              active: true,
              url,
              cookieStoreId: 'firefox-container-1'
            });
          } else {
            tab = await background.container.createTabInTempContainer({url});
            browser.tabs.create.resetHistory();
          }
        });

        describe('navigating with preference "never"', () => {
          beforeEach(async () => {
            switch (navigatingIn) {
            case 'sametab.global':
            case 'newtab.global':
              background.storage.local.preferences.isolation.global.navigation.action = 'never';
              break;

            case 'sametab.perdomain':
            case 'newtab.perdomain':
              background.storage.local.preferences.isolation.domain['example.com'] = defaultIsolationDomainPreferences;
              background.storage.local.preferences.isolation.domain['example.com'].navigation.action = 'never';
              break;
            }
          });

          describe('if its the exact same domain', () => {
            beforeEach(async () => {
              await navigateTo('https://example.com/moo');
            });

            it('should not open a new Temporary Container', async () => {
              browser.tabs.create.should.not.have.been.called;
            });
          });

          describe('if its the same domain', () => {
            beforeEach(async () => {
              await navigateTo('https://sub.example.com');
            });

            it('should not open a new Temporary Container', async () => {
              browser.tabs.create.should.not.have.been.called;
            });
          });

          describe('if its not the same domain', () => {
            beforeEach(async () => {
              await navigateTo('https://notexample.com');
            });

            it('should not open a new Temporary Container', async () => {
              browser.tabs.create.should.not.have.been.called;
            });
          });
        });

        describe('navigating with preference "always"', () => {
          beforeEach(async () => {
            switch (navigatingIn) {
            case 'sametab.global':
            case 'newtab.global':
              background.storage.local.preferences.isolation.global.navigation.action = 'always';
              break;

            case 'sametab.perdomain':
            case 'newtab.perdomain':
              background.storage.local.preferences.isolation.domain['example.com'] = defaultIsolationDomainPreferences;
              background.storage.local.preferences.isolation.domain['example.com'].navigation.action = 'always';
              break;
            }
          });

          describe('if its the exact same domain', () => {
            beforeEach(async () => {
              await navigateTo('https://example.com/moo');
            });

            it('should open a new Temporary Container', async () => {
              browser.tabs.create.should.have.been.calledOnce;
            });
          });

          describe('if its the same domain', () => {
            beforeEach(async () => {
              await navigateTo('https://sub.example.com');
            });

            it('should open a new Temporary Container', async () => {
              browser.tabs.create.should.have.been.calledOnce;
            });
          });

          describe('if its not the same domain', () => {
            beforeEach(async () => {
              await navigateTo('https://notexample.com');
            });

            it('should open a new Temporary Container', async () => {
              browser.tabs.create.should.have.been.calledOnce;
            });
          });

          describe('if the target domain is excluded', () => {
            beforeEach(async () => {
              switch (navigatingIn) {
              case 'sametab.global':
              case 'newtab.global':
                background.storage.local.preferences.isolation.global.excluded['excluded.com'] = {};
                break;

              case 'sametab.perdomain':
              case 'newtab.perdomain':
                background.storage.local.preferences.isolation.domain['example.com'] = defaultIsolationDomainPreferences;
                background.storage.local.preferences.isolation.domain['example.com'].excluded['excluded.com'] = {};
                break;
              }

              await navigateTo('https://excluded.com');
            });

            it('should not open a new Temporary Container', async () => {
              browser.tabs.create.should.not.have.been.called;
            });
          });
        });

        describe('navigating with preference "notsamedomain"', () => {
          beforeEach(() => {
            switch (navigatingIn) {
            case 'sametab.global':
            case 'newtab.global':
              background.storage.local.preferences.isolation.global.navigation.action = 'notsamedomain';
              break;

            case 'sametab.perdomain':
            case 'newtab.perdomain':
              background.storage.local.preferences.isolation.domain['example.com'] = defaultIsolationDomainPreferences;
              background.storage.local.preferences.isolation.domain['example.com'].navigation.action = 'notsamedomain';
              break;
            }
          });

          describe('if its the exact same domain', () => {
            beforeEach(async () => {
              await navigateTo('https://example.com/moo');
            });

            it('should not open a new Temporary Container', async () => {
              browser.tabs.create.should.not.have.been.called;
            });
          });

          describe('if its the same domain', () => {
            beforeEach(async () => {
              await navigateTo('https://sub.example.com');
            });

            it('should not open a new Temporary Container', async () => {
              browser.tabs.create.should.not.have.been.called;
            });
          });

          describe('if its not the same domain', () => {
            beforeEach(async () => {
              await navigateTo('https://notexample.com');
            });

            it('should open a new Temporary Container', async () => {
              browser.tabs.create.should.have.been.calledOnce;
            });
          });

          describe('if its not the same domain after a redirect', () => {
            beforeEach(async () => {
              browser.tabs._registerRedirects('https://out.example.com', [
                'https://notexample.com'
              ]);
              await navigateTo('https://out.example.com');
            });

            it('should open a new Temporary Container', async () => {
              browser.tabs.create.should.have.been.calledOnce;
            });
          });
        });

        describe('navigating with preference "notsamedomainexact"', () => {
          beforeEach(() => {
            switch (navigatingIn) {
            case 'sametab.global':
            case 'newtab.global':
              background.storage.local.preferences.isolation.global.navigation.action = 'notsamedomainexact';
              break;

            case 'sametab.perdomain':
            case 'newtab.perdomain':
              background.storage.local.preferences.isolation.domain['example.com'] = defaultIsolationDomainPreferences;
              background.storage.local.preferences.isolation.domain['example.com'].navigation.action = 'notsamedomainexact';
              break;
            }
          });

          describe('if its the exact same domain', () => {
            beforeEach(async () => {
              await navigateTo('https://example.com/moo');
            });

            it('should not open a new Temporary Container', async () => {
              browser.tabs.create.should.not.have.been.called;
            });
          });

          describe('if its the same domain', () => {
            beforeEach(async () => {
              await navigateTo('https://sub.example.com');
            });

            it('should open a new Temporary Container', async () => {
              browser.tabs.create.should.have.been.calledOnce;
            });
          });

          describe('if its not the same domain', () => {
            beforeEach(async () => {
              await navigateTo('https://notexample.com');
            });

            it('should open a new Temporary Container', async () => {
              browser.tabs.create.should.have.been.calledOnce;
            });
          });

          describe('follow-up redirects to the exact same domain after isolating', () => {

            beforeEach(async () => {
              browser.tabs._registerRedirects('http://notexample.com', [
                'https://notexample.com'
              ]);
              await navigateTo('http://notexample.com');
            });

            it('should not open two Temporary Containers', async () => {
              browser.tabs.create.should.have.been.calledOnce;
            });
          });
        });
      });


      describe('Multi-Account Containers Isolation', () => {
        describe('navigating in a permanent container', () => {

          beforeEach(async () => {
            background = await loadBareBackground(preferences, {apiFake: true});
            await background.initialize();
            tab = await browser.tabs._create({
              active: true,
              url: 'https://example.com',
              cookieStoreId: 'firefox-container-1'
            });
          });

          describe('with "enabled"', () => {
            beforeEach(async () => {
              background.storage.local.preferences.isolation.mac.action = 'enabled';
            });
            describe('if the navigation target isnt assigned to the current container', () => {
              beforeEach(async () => {
                browser.runtime.sendMessage.resolves({
                  userContextId: '1',
                  neverAsk: false
                });
                await navigateTo('https://assigned.com');
              });

              it('should not open a new Temporary Container', () => {
                browser.tabs.create.should.not.have.been.called;
              });
            });

            describe('if the navigation target isnt assigned to the current container', () => {
              beforeEach(async () => {
                browser.runtime.sendMessage.resolves(null);
                await navigateTo('https://notassigned.com');
              });

              it('should open a new Temporary Container', () => {
                browser.tabs.create.should.have.been.calledOnce;
              });
            });
          });

        });

        describe('navigating in a temporary container', () => {
          beforeEach(async () => {
            background = await loadBareBackground(preferences, {apiFake: true});
            await background.initialize();
            tab = await background.container.createTabInTempContainer({});
            browser.tabs.create.resetHistory();

          });

          describe('with "enabled" and target domain not assigned with MAC', () => {
            beforeEach(async () => {
              background.storage.local.preferences.isolation.mac.action = 'enabled';
              browser.runtime.sendMessage.resolves(null);
              await navigateTo('http://example.com');
            });


            it('should not open a new Temporary Container', () => {
              browser.tabs.create.should.not.have.been.called;
            });
          });
        });
      });


      describe('Always open in', () => {
        beforeEach(async () => {
          background = await loadBareBackground(preferences, {apiFake: true});
          await background.initialize();
          const url = 'https://example.com';
          if (originContainerType === 'permanent') {
            tab = await browser.tabs._create({
              active: true,
              url,
              cookieStoreId: 'firefox-container-1'
            });
          } else {
            tab = await background.container.createTabInTempContainer({url});
            browser.tabs.create.resetHistory();
          }
        });

        it('should not open in a new temporary container if the opener tab url belonging to the request matches the pattern', async () => {
          background.storage.local.preferences.isolation.domain = {
            'example.com': {
              always: {
                action: 'enabled',
                allowedInPermanent: false
              }
            }
          };

          await browser.tabs._create({
            url: 'https://example.com',
            openerTabId: tab.id,
            cookieStoreId: tab.cookieStoreId
          });

          switch (originContainerType) {
          case 'tmp':
            browser.tabs.create.should.not.have.been.called;
            break;

          case 'permanent':
            browser.tabs.create.should.have.been.calledOnce;
            break;
          }

        });
      });
    });});
  });});
});});
