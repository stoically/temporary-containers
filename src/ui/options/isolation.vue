<script>
  export default {
    data: () => ({
      loaded: false
    }),
    props: ['preferences'],
    watch: {
      async preferences() {
        $('#saveIsolationGlobalPreferences').on('click', window.saveIsolationGlobalPreferences);
        $('#saveIsolationMacPreferences').on('click', window.saveIsolationGlobalPreferences);

        $('#isolationGlobal').dropdown('set selected', preferences.isolation.global.navigation.action);
        if (preferences.isolation.global.navigation.action !== 'never') {
          $('#isolationGlobalAccordion').accordion('open', 0);
        }

        $('#isolationGlobalMouseClickMiddle').dropdown('set selected', preferences.isolation.global.mouseClick.middle.action);
        $('#isolationGlobalMouseClickCtrlLeft').dropdown('set selected', preferences.isolation.global.mouseClick.ctrlleft.action);
        $('#isolationGlobalMouseClickLeft').dropdown('set selected', preferences.isolation.global.mouseClick.left.action);
        if (preferences.isolation.global.mouseClick.middle.action !== 'never' ||
            preferences.isolation.global.mouseClick.ctrlleft.action !== 'never' ||
            preferences.isolation.global.mouseClick.left.action !== 'never') {
          $('#isolationGlobalAccordion').accordion('open', 1);
        }

        if (Object.keys(preferences.isolation.global.excludedContainers).length) {
          $('#isolationGlobalAccordion').accordion('open', 2);
        }

        isolationGlobalExcludedDomains = preferences.isolation.global.excluded;
        if (Object.keys(preferences.isolation.global.excluded).length) {
          $('#isolationGlobalAccordion').accordion('open', 3);
        }

        $('#isolationMac').dropdown('set selected', preferences.isolation.mac.action);

        $('#linkClickGlobalMiddleCreatesContainer').dropdown('set selected', preferences.isolation.global.mouseClick.middle.container);
        $('#linkClickGlobalCtrlLeftCreatesContainer').dropdown('set selected', preferences.isolation.global.mouseClick.ctrlleft.container);
        $('#linkClickGlobalLeftCreatesContainer').dropdown('set selected', preferences.isolation.global.mouseClick.left.container);

        const excludeContainers = [];
        const containers = await browser.contextualIdentities.query({});
        containers.map(container => {
          if (storage.tempContainers[container.cookieStoreId]) {
            return;
          }
          excludeContainers.push({
            name: container.name,
            value: container.cookieStoreId,
            selected: !!preferences.isolation.global.excludedContainers[container.cookieStoreId]
          });
        });
        $('#isolationGlobalExcludeContainers').dropdown({
          placeholder: 'Select permanent containers to exclude from Isolation',
          values: excludeContainers
        });

        $('#isolationDomainForm').form({
          fields: {
            isolationDomainPattern: 'empty'
          },
          onSuccess: (event) => {
            event.preventDefault();
            isolationDomainAddRule();
          }
        });

        $('#isolationGlobalExcludeDomainSave').on('click', (event) => {
          event.preventDefault();
          isolationGlobalAddExcludeDomainRule();
        });

        $('#isolationDomainExcludeDomainSave').on('click', (event) => {
          event.preventDefault();
          isolationDomainAddExcludeDomainRule();
        });


        $('#isolationDomainPatternDiv').popup({
          html: domainPatternToolTip,
          inline: true,
          position: 'bottom left'
        });

        $('#isolationGlobalExcludeDomainPatternDiv').popup({
          html: domainPatternToolTip,
          inline: true,
          position: 'bottom left'
        });

        $('#isolationDomainExcludeDomainPatternDiv').popup({
          html: domainPatternToolTip,
          inline: true,
          position: 'bottom left'
        });

        window.updateIsolationGlobalExcludeDomains();
        window.updateIsolationDomains();
        window.updateIsolationDomainExcludeDomains();

        this.loaded = true;
      }
    }
  }
</script>

<template>
  <div v-show="loaded" class="ui tab segment" data-tab="isolation">
    <div class="ui top attached tabular menu">
      <a class="active item" data-tab="isolation/global">Global</a>
      <a class="item" data-tab="isolation/perdomain">Per Domain</a>
      <a class="item" data-tab="isolation/mac">Multi-Account Containers</a>
    </div>
    <div class="ui bottom attached active tab segment" data-tab="isolation/global">
      <a class="ui blue ribbon label" href="https://github.com/stoically/temporary-containers/wiki/Global-Isolation" target="_blank">
        <i class="icon-info-circled"></i> Global Isolation?
      </a><br><br>
      <div class="ui form">
        <div class="ui accordion" id="isolationGlobalAccordion">
          <div class="title">
            <h4><i class="dropdown icon"></i>
              Navigating in Tabs should open new Temporary Containers
            </h4>
          </div>
          <div class="ui segment content">
            <div class="field">
              <select id="isolationGlobal" class="ui fluid dropdown">
                <option value="always">Always</option>
                <option value="notsamedomainexact">If the Navigation Target domain does not exactly match the active tabs domain - Subdomains also get isolated</option>
                <option value="notsamedomain">If the Navigation Target domain does not match the active tabs domain - Subdomains won't get isolated</option>
                <option value="never">Never</option>
              </select>
            </div>
          </div>
          <div class="title">
            <h4><i class="dropdown icon"></i>
              Mouse Clicks on links should open new Temporary Containers
            </h4>
          </div>
          <div class="ui segment content">
            <div class="field">
              <label>Middle Mouse</label>
              <select id="isolationGlobalMouseClickMiddle" class="ui fluid dropdown">
                <option value="always">Always</option>
                <option value="notsamedomainexact">If the clicked Link domain does not exactly match the active tabs domain - Subdomains also get isolated</option>
                <option value="notsamedomain">If the clicked Link domain does not match the active tabs domain - Subdomains won't get isolated</option>
                <option value="never">Never</option>
              </select>
            </div>
            <div class="field">
              <label>Ctrl/Cmd+Left Mouse</label>
              <select id="isolationGlobalMouseClickCtrlLeft" class="ui fluid dropdown">
                <option value="always">Always</option>
                <option value="notsamedomainexact">If the clicked Link domain does not exactly match the active tabs domain - Subdomains also get isolated</option>
                <option value="notsamedomain">If the clicked Link domain does not match the active tabs domain - Subdomains won't get isolated</option>
                <option value="never">Never</option>
              </select>
            </div>
            <div class="field">
              <label>Left Mouse</label>
              <select id="isolationGlobalMouseClickLeft" class="ui fluid dropdown">
                <option value="always">Always</option>
                <option value="notsamedomainexact">If the clicked Link domain does not exactly match the current tabs domain - Subdomains also get isolated</option>
                <option value="notsamedomain">If the clicked Link domain does not match the current tabs domain - Subdomains won't get isolated</option>
                <option value="never">Never</option>
              </select>
            </div>
          </div>
          <div class="title">
            <h4><i class="dropdown icon"></i>
              Exclude permanent containers from Isolation
            </h4>
          </div>
          <div class="ui segment content">
            <div class="field">
              <div class="ui dropdown fluid selection multiple" id="isolationGlobalExcludeContainers">
                <div class="text"></div>
                <i class="dropdown icon"></i>
              </div>
            </div>
          </div>
          <div class="title">
              <h4><i class="dropdown icon"></i>
                Exclude domains from Isolation
              </h4>
            </div>
            <div class="ui segment content">
              <div class="field">
                <div id="isolationGlobalExcludeDomainPatternDiv" class="field">
                  <label>Domain Pattern</label>
                  <input id="isolationGlobalExcludeDomainPattern" type="text">
                </div>
                <div class="field">
                  <button id="isolationGlobalExcludeDomainSave" class="ui button primary">Exclude</button>
                </div>
                <div>
                  <h3>Excluded domains</h3>
                  <div class="ui bulleted list" id="isolationGlobalExcludedDomains">
                  </div>
                </div>
              </div>
            </div>
        </div>
        <br>
        <div class="field">
          <button id="saveIsolationGlobalPreferences" class="ui button primary">Save</button>
        </div>
      </div>
    </div>
    <div class="ui bottom attached tab segment" data-tab="isolation/perdomain">
      <a class="ui blue ribbon label" href="https://github.com/stoically/temporary-containers/wiki/Per-domain-Isolation" target="_blank">
        <i class="icon-info-circled"></i> Per domain Isolation?
      </a><br><br>
      <div class="ui form" id="isolationDomainForm">
        <div id="isolationDomainPatternDiv" class="field">
          <label>Domain Pattern</label>
          <input id="isolationDomainPattern" type="text">
        </div>
        <div class="ui accordion" id="isolationPerDomainAccordion">
          <div class="title">
            <h4><i class="dropdown icon"></i>
              Always open in new Temporary Containers
            </h4>
          </div>
          <div class="ui segment content">
            <div class="field">
              <select id="isolationDomainAlways" class="ui fluid dropdown">
                <option value="enabled">Enabled</option>
                <option value="disabled" selected="selected">Disabled</option>
              </select>
            </div>
            <div class="field">
              <div class="ui checkbox">
                <input type="checkbox" id="isolationDomainAlwaysAllowedInPermanent">
                <label>Allow to load in permanent containers</label>
              </div>
            </div>
          </div>
          <div class="title">
            <h4><i class="dropdown icon"></i>
              Navigating in Tabs should open new Temporary Containers
            </h4>
          </div>
          <div class="ui segment content">
            <div class="field">
              <select id="isolationDomainNavigation" class="ui fluid dropdown">
                <option value="global" selected="selected">Use Global</option>
                <option value="always">Always</option>
                <option value="notsamedomainexact">If the Navigation Target domain does not exactly match the active tabs domain - Subdomains also get isolated</option>
                <option value="notsamedomain">If the Navigation Target domain does not match the active tabs domain - Subdomains won't get isolated</option>
                <option value="never">Never</option>
              </select>
            </div>
          </div>
          <div class="title">
            <h4><i class="dropdown icon"></i>
              Mouse Clicks on links should open new Temporary Containers
            </h4>
          </div>
          <div class="ui segment content">
            <div class="field">
              <label>Middle Mouse</label>
              <select id="isolationDomainMouseClickMiddle" class="ui fluid dropdown">
                <option value="global" selected="selected">Use Global</option>
                <option value="always">Always</option>
                <option value="notsamedomainexact">If the clicked Link domain does not exactly match the active tabs domain - Subdomains also get isolated</option>
                <option value="notsamedomain">If the clicked Link domain does not match the active tabs domain - Subdomains won't get isolated</option>
                <option value="never">Never</option>
              </select>
            </div>
            <div class="field">
              <label>Ctrl/Cmd+Left Mouse</label>
              <select id="isolationDomainMouseClickCtrlLeft" class="ui fluid dropdown">
                <option value="global" selected="selected">Use Global</option>
                <option value="always">Always</option>
                <option value="notsamedomainexact">If the clicked Link domain does not exactly match the active tabs domain - Subdomains also get isolated</option>
                <option value="notsamedomain">If the clicked Link domain does not match the active tabs domain - Subdomains won't get isolated</option>
                <option value="never">Never</option>
              </select>
            </div>
            <div class="field">
              <label>Left Mouse</label>
              <select id="isolationDomainMouseClickLeft" class="ui fluid dropdown">
                <option value="global" selected="selected">Use Global</option>
                <option value="always">Always</option>
                <option value="notsamedomainexact">If the clicked Link domain does not exactly match the active tabs domain - Subdomains also get isolated</option>
                <option value="notsamedomain">If the clicked Link domain does not match the active tabs domain - Subdomains won't get isolated</option>
                <option value="never">Never</option>
              </select>
            </div>
          </div>
          <div class="title">
            <h4><i class="dropdown icon"></i>
              Exclude target domains
            </h4>
          </div>
          <div class="ui segment content">
            <div class="field">
              <div id="isolationDomainExcludeDomainPatternDiv" class="field">
                <label>Domain Pattern</label>
                <input id="isolationDomainExcludeDomainPattern" type="text">
              </div>
              <div class="field">
                <button id="isolationDomainExcludeDomainSave" class="ui button primary">Exclude</button>
              </div>
              <div>
                <h3>Excluded target domains</h3>
                <div class="ui bulleted list" id="isolationDomainExcludedDomains">
                </div>
              </div>
            </div>
          </div>
        </div>
        <br>
        <div class="field">
          <button id="isolationDomainSave" class="ui button primary">Add or Edit</button>
        </div>
        <br>
        <div>
          <h3>Domains</h3>
          <div class="ui bulleted list" id="isolationDomains">
          </div>
        </div>
      </div>
    </div>
    <div class="ui bottom attached tab segment" data-tab="isolation/mac">
      <a class="ui blue ribbon label" href="https://github.com/stoically/temporary-containers/wiki/Multi-Account-Containers-Isolation" target="_blank">
        <i class="icon-info-circled"></i> Multi-Account Containers Isolation?
      </a><br><br>
      <div class="ui form">
        <h4>
          Open new Temporary Containers if a permanent container tab tries to load
          a domain that isn't assigned to "Always open in" that container with
          <a href="https://addons.mozilla.org/firefox/addon/multi-account-containers/" target="_blank">Multi-Account Containers</a>
          (Note: This is different from the Per Domain "Always open in" configuration)
        </h4>
        <div class="field">
          <select id="isolationMac" class="ui fluid dropdown">
            <option value="disabled">Disabled</option>
            <option value="enabled">Enabled</option>
          </select>
        </div>
        <div class="field">
          <button id="saveIsolationMacPreferences" class="ui button primary">Save</button>
        </div>
      </div>
    </div>
  </div>
</template>
