<script>
export default {
  props: {
    app: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      preferences: this.app.preferences,
      storage: this.app.storage,
      show: false
    };
  },
  async mounted() {
    $('#isolationGlobal .ui.accordion').accordion({exclusive: false});
    $('#isolationGlobal .ui.dropdown').dropdown();

    $('#isolationGlobalAccordion').accordion('open', 0);

    if (this.preferences.isolation.global.mouseClick.middle.action !== 'never' ||
          this.preferences.isolation.global.mouseClick.ctrlleft.action !== 'never' ||
          this.preferences.isolation.global.mouseClick.left.action !== 'never') {
      $('#isolationGlobalAccordion').accordion('open', 1);
    }

    if (Object.keys(this.preferences.isolation.global.excludedContainers).length) {
      $('#isolationGlobalAccordion').accordion('open', 2);
    }

    isolationGlobalExcludedDomains = this.preferences.isolation.global.excluded;
    if (Object.keys(this.preferences.isolation.global.excluded).length) {
      $('#isolationGlobalAccordion').accordion('open', 3);
    }



    const excludeContainers = [];
    const containers = await browser.contextualIdentities.query({});
    containers.map(container => {
      if (this.storage.tempContainers[container.cookieStoreId]) {
        return;
      }
      excludeContainers.push({
        name: container.name,
        value: container.cookieStoreId,
        selected: !!this.preferences.isolation.global.excludedContainers[container.cookieStoreId]
      });
    });
    $('#isolationGlobalExcludeContainers').dropdown({
      placeholder: 'Select permanent containers to exclude from Isolation',
      values: excludeContainers
    });

    $('#isolationGlobalExcludeDomainSave').on('click', (event) => {
      event.preventDefault();
      isolationGlobalAddExcludeDomainRule();
    });

    window.isolationGlobalExcludedDomains = {};
    window.isolationGlobalExcludeDomainPatternsClickEvent = false;
    window.updateIsolationGlobalExcludeDomains = () => {
      const isolationGlobalExcludeDomainPatternsDiv = $('#isolationGlobalExcludedDomains');
      const isolationGlobalExcludeDomainPatterns = Object.keys(isolationGlobalExcludedDomains);
      if (!isolationGlobalExcludeDomainPatterns.length) {
        isolationGlobalExcludeDomainPatternsDiv.html('No domains excluded');
        return;
      }
      isolationGlobalExcludeDomainPatternsDiv.html('');
      isolationGlobalExcludeDomainPatterns.map((domainPattern) => {
        const el = $(`<div class="item" id="${encodeURIComponent(domainPattern)}">` +
      domainPattern +
      ' <a href="#" id="removeDomainPattern" data-tooltip="Remove (no confirmation)" ' +
      '><i class="icon-trash-empty"></i>️</a></div>');
        isolationGlobalExcludeDomainPatternsDiv.append(el);
      });

      if (!isolationGlobalExcludeDomainPatternsClickEvent) {
        isolationGlobalExcludeDomainPatternsDiv.on('click', async (event) => {
          event.preventDefault();
          const targetId = $(event.target).parent().attr('id');
          const domainPattern = $(event.target).parent().parent().attr('id');
          if (targetId === 'removeDomainPattern') {
            delete isolationGlobalExcludedDomains[decodeURIComponent(domainPattern)];
            updateIsolationGlobalExcludeDomains();
          }
        });
        isolationGlobalExcludeDomainPatternsClickEvent = true;
      }
    };

    window.isolationGlobalAddExcludeDomainRule = () => {
      const excludeDomainPattern = document.querySelector('#isolationGlobalExcludeDomainPattern').value;
      if (!excludeDomainPattern) {
        $('#isolationGlobalExcludeDomainPatternDiv').addClass('error');
        return;
      }
      $('#isolationGlobalExcludeDomainPatternDiv').removeClass('error');
      isolationGlobalExcludedDomains[excludeDomainPattern] = {};
      updateIsolationGlobalExcludeDomains();
    };

    window.saveIsolationGlobalPreferences = async (event) => {
      event.preventDefault();

      this.preferences.isolation.global.navigation.action = document.querySelector('#isolationGlobalNavigationAction').value;
      this.preferences.isolation.global.mouseClick = {
        middle: {
          action: document.querySelector('#isolationGlobalMouseClickMiddle').value,
          container: document.querySelector('#linkClickGlobalMiddleCreatesContainer').value
        },
        ctrlleft: {
          action: document.querySelector('#isolationGlobalMouseClickCtrlLeft').value,
          container: document.querySelector('#linkClickGlobalCtrlLeftCreatesContainer').value
        },
        left: {
          action: document.querySelector('#isolationGlobalMouseClickLeft').value,
          container: document.querySelector('#linkClickGlobalLeftCreatesContainer').value
        }
      };

      this.preferences.isolation.global.excluded = isolationGlobalExcludedDomains;

      this.preferences.isolation.global.excludedContainers = {};
      const excludedContainers = $('#isolationGlobalExcludeContainers').dropdown('get values');
      if (excludedContainers) {
        excludedContainers.map(excludeContainer => {
          this.preferences.isolation.global.excludedContainers[excludeContainer] = {};
        });
      }

      this.preferences.isolation.mac.action = document.querySelector('#isolationMac').value;

      window.updateIsolationGlobalExcludeDomains();
    };

    this.show = true;
  }
};
</script>

<template>
  <div
    v-show="show"
    id="isolationGlobal"
  >
    <a
      class="ui blue ribbon label"
      href="https://github.com/stoically/temporary-containers/wiki/Global-Isolation"
      target="_blank"
    >
      <i class="icon-info-circled" /> Global Isolation?
    </a>
    <div class="ui message">
      Isolation lets you configure that navigating in tabs (also known as "web browsing") should
      open new Temporary Containers instead of navigating to the target <a
        href="https://simple.wikipedia.org/wiki/Domain_name"
        target="_blank"
      >domain</a>, hence isolating the origin domain.
    </div>
    <div class="ui form">
      <div
        id="isolationGlobalAccordion"
        class="ui accordion"
      >
        <div class="title">
          <h4>
            <i class="dropdown icon" />
            Navigating in Tabs should open new Temporary Containers
          </h4>
        </div>
        <div class="ui segment content">
          <div class="field">
            <select
              id="isolationGlobalNavigationAction"
              v-model="preferences.isolation.global.navigation.action"
              class="ui fluid dropdown"
            >
              <option value="never">
                Never
              </option>
              <option value="notsamedomainexact">
                If the navigation target domain does not exactly match the active tabs domain - Subdomains also get isolated
              </option>
              <option value="notsamedomain">
                If the navigation target domain does not match the active tabs domain - Subdomains won't get isolated
              </option>
              <option value="always">
                Always
              </option>
            </select>
          </div>
        </div>
        <div class="title">
          <h4>
            <i class="dropdown icon" />
            Mouse Clicks on links should open new Temporary Containers
          </h4>
        </div>
        <div class="ui segment content">
          <div class="ui small message">
            The Navigating in Tabs configuration also covers mouse clicks (since they result in a navigation), so you might not need to additionally
            configure mouse clicks, unless you want a more strict configuration for specific mouse clicks. Navigating in Tabs is also more reliable,
            so you should prefer that if possible.
          </div>
          <div class="field">
            <label>Middle Mouse</label>
            <select
              id="isolationGlobalMouseClickMiddle"
              v-model="preferences.isolation.global.mouseClick.middle.action"
              class="ui fluid dropdown"
            >
              <option value="never">
                Never
              </option>
              <option value="notsamedomainexact">
                If the clicked link domain does not exactly match the active tabs domain - Subdomains also get isolated
              </option>
              <option value="notsamedomain">
                If the clicked link domain does not match the active tabs domain - Subdomains won't get isolated
              </option>
              <option value="always">
                Always
              </option>
            </select>
          </div>
          <div class="field">
            <label>Ctrl/Cmd+Left Mouse</label>
            <select
              id="isolationGlobalMouseClickCtrlLeft"
              v-model="preferences.isolation.global.mouseClick.ctrlleft.action"
              class="ui fluid dropdown"
            >
              <option value="never">
                Never
              </option>
              <option value="notsamedomainexact">
                If the clicked link domain does not exactly match the active tabs domain - Subdomains also get isolated
              </option>
              <option value="notsamedomain">
                If the clicked link domain does not match the active tabs domain - Subdomains won't get isolated
              </option>
              <option value="always">
                Always
              </option>
            </select>
          </div>
          <div class="field">
            <label>Left Mouse</label>
            <select
              id="isolationGlobalMouseClickLeft"
              v-model="preferences.isolation.global.mouseClick.left.action"
              class="ui fluid dropdown"
            >
              <option value="never">
                Never
              </option>
              <option value="notsamedomainexact">
                If the clicked link domain does not exactly match the active tabs domain - Subdomains also get isolated
              </option>
              <option value="notsamedomain">
                If the clicked link domain does not match the active tabs domain - Subdomains won't get isolated
              </option>
              <option value="always">
                Always
              </option>
            </select>
          </div>
        </div>
        <div class="title">
          <h4>
            <i class="dropdown icon" />
            Exclude permanent containers from Isolation
          </h4>
        </div>
        <div class="ui segment content">
          <div class="field">
            <div
              id="isolationGlobalExcludeContainers"
              class="ui dropdown fluid selection multiple"
            >
              <div class="text" />
              <i class="dropdown icon" />
            </div>
          </div>
        </div>
        <div class="title">
          <h4>
            <i class="dropdown icon" />
            Exclude target domains from Isolation
          </h4>
        </div>
        <div class="ui segment content">
          <div class="field">
            <div
              id="isolationGlobalExcludeDomainPatternDiv"
              class="field"
            >
              <label>Domain Pattern</label>
              <input
                id="isolationGlobalExcludeDomainPattern"
                type="text"
              >
            </div>
            <div class="field">
              <button
                id="isolationGlobalExcludeDomainSave"
                class="ui button primary"
              >
                Exclude
              </button>
            </div>
            <div>
              <h3>Excluded domains</h3>
              <div
                id="isolationGlobalExcludedDomains"
                class="ui bulleted list"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
