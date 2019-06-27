<script>
import DomainPattern from '../domainpattern';

const domainDefaults = {
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

export default {
  components: {
    DomainPattern
  },
  props: {
    app: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      preferences: this.app.preferences,
      domainPattern: '',
      domainPatternDisabled: false,
      domain: JSON.parse(JSON.stringify(domainDefaults)),
      editing: false
    };
  },
  watch: {
    domainPattern(domainPattern) {
      if (!this.editing && this.preferences.isolation.domain[domainPattern]) {
        $('#isolationDomainForm').form('validate form');
      }
    }
  },
  mounted() {
    $('#isolationDomain .ui.accordion').accordion({exclusive: false});
    $('#isolationDomain .ui.dropdown').dropdown();
    $('#isolationDomain .ui.checkbox').checkbox();

    $.fn.form.settings.rules.domainPattern = (value) => {
      return !this.editing && !this.preferences.isolation.domain[value];
    };

    $('#isolationDomainForm').form({
      inline: true,
      fields: {
        isolationDomainPattern: {
          rules: [
            {
              type: 'empty',
              prompt: 'Domain Pattern can\'t be empty'
            },
            {
              type: 'domainPattern',
              prompt: 'Domain Pattern already exists'
            }
          ]
        }
      },
      onSuccess: (event) => {
        if (event) {
          event.preventDefault();
        }

        if (this.editing) {
          this.editing = false;
        } else {
          this.$set(this.preferences.isolation.domain, this.domainPattern, JSON.parse(JSON.stringify(this.domain)));
        }
        this.reset();
      }
    });
  },
  methods: {
    reset() {
      this.domainPattern = '';
      this.domainPatternDisabled = false;
      this.domain = JSON.parse(JSON.stringify(domainDefaults));
      $('#isolationPerDomainAccordion').accordion('close', 0);
      $('#isolationPerDomainAccordion').accordion('close', 1);
      $('#isolationPerDomainAccordion').accordion('close', 2);
      $('#isolationPerDomainAccordion').accordion('close', 3);
      this.resetDropdowns();
    },
    resetDropdowns() {
      $('#isolationDomain .ui.dropdown').dropdown('destroy');
      this.$nextTick(() => {
        $('#isolationDomain .ui.dropdown').dropdown();
      });
    },
    edit(domainPattern) {
      this.editing = true;
      this.domain = this.preferences.isolation.domain[domainPattern];
      this.domainPattern = domainPattern;
      this.domainPatternDisabled = true;
      this.resetDropdowns();

      $('#isolationPerDomainAccordion').accordion(
        this.domain.always.action === domainDefaults.always.action ? 'close' : 'open', 0
      );
      $('#isolationPerDomainAccordion').accordion(
        this.domain.navigation.action === domainDefaults.navigation.action ? 'close' : 'open', 1
      );
      $('#isolationPerDomainAccordion').accordion(
        this.domain.mouseClick.middle.action === domainDefaults.mouseClick.middle.action &&
        this.domain.mouseClick.ctrlleft.action === domainDefaults.mouseClick.ctrlleft.action &&
        this.domain.mouseClick.left.action === domainDefaults.mouseClick.left.action ? 'close' : 'open', 2
      );
      $('#isolationPerDomainAccordion').accordion(
        !Object.keys(this.domain.excluded).length ? 'close' : 'open', 3
      );
    },
    remove(domainPattern) {
      const confirmed = window.confirm(`
        Remove ${domainPattern}?
      `);
      if (confirmed) {
        this.$delete(this.preferences.isolation.domain, domainPattern);
        if (this.editing && this.domainPattern === domainPattern) {
          this.reset();
          this.editing = false;
        }
      }
    }
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
      <domain-pattern
        id="isolationDomainPattern"
        :disabled="domainPatternDisabled"
        :domain-pattern.sync="domainPattern"
      />
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
              v-model="domain.always.action"
              class="ui fluid dropdown"
            >
              <option value="enabled">
                Enabled
              </option>
              <option value="disabled">
                Disabled
              </option>
            </select>
          </div>
          <div class="field">
            <div class="ui checkbox">
              <input
                id="isolationDomainAlwaysAllowedInPermanent"
                v-model="domain.always.allowedInPermanent"
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
              v-model="domain.navigation.action"
              class="ui fluid dropdown"
            >
              <option value="global">
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
              v-model="domain.mouseClick.middle.action"
              class="ui fluid dropdown"
            >
              <option value="global">
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
              v-model="domain.mouseClick.ctrlleft.action"
              class="ui fluid dropdown"
            >
              <option value="global">
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
              v-model="domain.mouseClick.left.action"
              class="ui fluid dropdown"
            >
              <option value="global">
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
                Add excluded domain
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
          {{ editing ? `Done editing ${domainPattern}` : 'Add' }}
        </button>
      </div>
      <br>
    </form>
    <div>
      <h3>Per Domain Patterns</h3>
      <div v-if="!Object.keys(preferences.isolation.domain).length">
        No domains added yet
      </div>
      <div v-else>
        <div
          v-for="(_domainPrefs, _domainPattern) in preferences.isolation.domain"
          :key="_domainPattern"
        >
          <div class="ui divider" />
          <div>
            <button
              class="ui right primary tiny button"
              data-tooltip="Edit"
              @click="edit(_domainPattern)"
            >
              <i class="icon-pencil" />
            </button>
            <button
              class="ui right negative tiny button"
              data-tooltip="Remove"
              @click="remove(_domainPattern)"
            >
              <i class="icon-trash-empty" />
            </button>
            {{ _domainPattern }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>