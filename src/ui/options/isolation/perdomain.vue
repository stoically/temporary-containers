<script>
export default {
  props: {
    preferences: {
      type: Object,
      default: () => {}
    }
  },
  mounted() {
    $('#isolationDomain .ui.accordion').accordion({exclusive: false});
    $('#isolationDomain .ui.dropdown').dropdown();

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

    $('#isolationDomainExcludeDomainSave').on('click', (event) => {
      event.preventDefault();
      isolationDomainAddExcludeDomainRule();
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

    window.updateIsolationDomains();
    window.updateIsolationDomainExcludeDomains();
  }
};
</script>


<template>
  <div id="isolationDomain">
    <a
      class="ui blue ribbon label"
      href="https://github.com/stoically/temporary-containers/wiki/Per-domain-Isolation"
      target="_blank"
    >
      <i class="icon-info-circled" /> Per Domain Isolation?
    </a><br><br>
    <form
      id="isolationDomainForm"
      class="ui form"
    >
      <div
        id="isolationDomainPatternDiv"
        class="field"
      >
        <label>Domain Pattern</label>
        <input
          id="isolationDomainPattern"
          type="text"
        >
      </div>
      <div
        id="isolationPerDomainAccordion"
        class="ui accordion"
      >
        <div class="title">
          <h4>
            <i class="dropdown icon" />
            Always open in new Temporary Containers
          </h4>
        </div>
        <div class="ui segment content">
          <div class="field">
            <select
              id="isolationDomainAlways"
              class="ui fluid dropdown"
            >
              <option value="enabled">
                Enabled
              </option>
              <option
                value="disabled"
                selected="selected"
              >
                Disabled
              </option>
            </select>
          </div>
          <div class="field">
            <div class="ui checkbox">
              <input
                id="isolationDomainAlwaysAllowedInPermanent"
                type="checkbox"
              >
              <label>Allow to load in permanent containers</label>
            </div>
          </div>
        </div>
        <div class="title">
          <h4>
            <i class="dropdown icon" />
            Navigating in Tabs should open new Temporary Containers
          </h4>
        </div>
        <div class="ui segment content">
          <div class="field">
            <select
              id="isolationDomainNavigation"
              class="ui fluid dropdown"
            >
              <option
                value="global"
                selected="selected"
              >
                Use Global
              </option>
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
              id="isolationDomainMouseClickMiddle"
              class="ui fluid dropdown"
            >
              <option
                value="global"
                selected="selected"
              >
                Use Global
              </option>
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
              id="isolationDomainMouseClickCtrlLeft"
              class="ui fluid dropdown"
            >
              <option
                value="global"
                selected="selected"
              >
                Use Global
              </option>
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
              id="isolationDomainMouseClickLeft"
              class="ui fluid dropdown"
            >
              <option
                value="global"
                selected="selected"
              >
                Use Global
              </option>
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
        </div>
        <div class="title">
          <h4>
            <i class="dropdown icon" />
            Exclude target domains
          </h4>
        </div>
        <div class="ui segment content">
          <div class="field">
            <div
              id="isolationDomainExcludeDomainPatternDiv"
              class="field"
            >
              <label>Domain Pattern</label>
              <input
                id="isolationDomainExcludeDomainPattern"
                type="text"
              >
            </div>
            <div class="field">
              <button
                id="isolationDomainExcludeDomainSave"
                class="ui button primary"
              >
                Exclude
              </button>
            </div>
            <div>
              <h3>Excluded target domains</h3>
              <div
                id="isolationDomainExcludedDomains"
                class="ui bulleted list"
              />
            </div>
          </div>
        </div>
      </div>
      <br>
      <div class="field">
        <button
          id="isolationDomainSave"
          class="ui button primary"
        >
          Add or Edit
        </button>
      </div>
      <br>
      <div>
        <h3>Domains</h3>
        <div
          id="isolationDomains"
          class="ui bulleted list"
        />
      </div>
    </form>
  </div>
</template>
