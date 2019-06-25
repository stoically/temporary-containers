<script>
export default {
  props: {
    preferences: {
      type: Object,
      default: () => {}
    }
  },
  data: () => ({
    show: false
  }),
  async mounted() {
    $('#isolationGlobal .ui.accordion').accordion({exclusive: false});
    $('#isolationGlobal .ui.dropdown').dropdown();

    $('#isolationGlobalNavigationAction').dropdown('set selected', preferences.isolation.global.navigation.action);
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

    $('#isolationGlobalExcludeDomainSave').on('click', (event) => {
      event.preventDefault();
      isolationGlobalAddExcludeDomainRule();
    });

    window.updateIsolationGlobalExcludeDomains();

    $('#saveIsolationGlobalPreferences').on('click', window.saveIsolationGlobalPreferences);

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
    </a><br><br>
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
              class="ui fluid dropdown"
            >
              <option value="always">
                Always
              </option>
              <option value="notsamedomainexact">
                If the Navigation Target domain does not exactly match the active tabs domain - Subdomains also get isolated
              </option>
              <option value="notsamedomain">
                If the Navigation Target domain does not match the active tabs domain - Subdomains won't get isolated
              </option>
              <option value="never">
                Never
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
          <div class="field">
            <label>Middle Mouse</label>
            <select
              id="isolationGlobalMouseClickMiddle"
              class="ui fluid dropdown"
            >
              <option value="always">
                Always
              </option>
              <option value="notsamedomainexact">
                If the clicked Link domain does not exactly match the active tabs domain - Subdomains also get isolated
              </option>
              <option value="notsamedomain">
                If the clicked Link domain does not match the active tabs domain - Subdomains won't get isolated
              </option>
              <option value="never">
                Never
              </option>
            </select>
          </div>
          <div class="field">
            <label>Ctrl/Cmd+Left Mouse</label>
            <select
              id="isolationGlobalMouseClickCtrlLeft"
              class="ui fluid dropdown"
            >
              <option value="always">
                Always
              </option>
              <option value="notsamedomainexact">
                If the clicked Link domain does not exactly match the active tabs domain - Subdomains also get isolated
              </option>
              <option value="notsamedomain">
                If the clicked Link domain does not match the active tabs domain - Subdomains won't get isolated
              </option>
              <option value="never">
                Never
              </option>
            </select>
          </div>
          <div class="field">
            <label>Left Mouse</label>
            <select
              id="isolationGlobalMouseClickLeft"
              class="ui fluid dropdown"
            >
              <option value="always">
                Always
              </option>
              <option value="notsamedomainexact">
                If the clicked Link domain does not exactly match the current tabs domain - Subdomains also get isolated
              </option>
              <option value="notsamedomain">
                If the clicked Link domain does not match the current tabs domain - Subdomains won't get isolated
              </option>
              <option value="never">
                Never
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
            Exclude domains from Isolation
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
      <br>
      <div class="field">
        <button
          id="saveIsolationGlobalPreferences"
          class="ui button primary"
        >
          Save
        </button>
      </div>
    </div>
  </div>
</template>
