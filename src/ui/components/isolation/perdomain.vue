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
      popup: this.app.popup,
      domainPattern: '',
      domainPatternDisabled: false,
      domain: JSON.parse(JSON.stringify(domainDefaults)),
      excludeDomainPattern: '',
      editing: false,
      show: false
    };
  },
  watch: {
    domainPattern(domainPattern) {
      if (!this.editing && this.preferences.isolation.domain[domainPattern]) {
        $('#isolationDomainForm').form('validate form');
      }
    }
  },
  async mounted() {
    this.$nextTick(() => {
      $('#isolationDomain .ui.accordion').accordion({
        ...this.popup ? {
          animateChildren: false,
          duration: 0} : {},
        exclusive: false
      });

      $('#isolationDomain .ui.dropdown').dropdown();
      $('#isolationDomain .ui.checkbox').checkbox();

      this.show = true;
    });

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

    $('#isolationDomainExcludeDomainsForm').form({
      fields: {
        isolationDomainExcludeDomainPattern: 'empty'
      },
      onSuccess: (event) => {
        event.preventDefault();
        this.$set(this.domain.excluded, this.excludeDomainPattern, {});
        this.excludeDomainPattern = '';
      }
    });

    if (this.popup) {
      if (!this.app.activeTab.url.startsWith('http')) {
        return;
      }
      if (this.preferences.isolation.domain[this.app.activeTab.parsedUrl.hostname]) {
        this.edit(this.app.activeTab.parsedUrl.hostname);
      } else {
        this.domainPattern = this.app.activeTab.parsedUrl.hostname;
      }
    }
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
    },
    removeExcludedDomain(excludedDomainPattern) {
      this.$delete(this.domain.excluded, excludedDomainPattern);
    }
  }
};
</script>

<style>
.popup-margin {
  margin: 0 15px 10px 0;
}
.popup-exclude-margin {
  margin: 0 15px 10px 25px;
}
</style>


<template>
  <div
    v-show="show"
    id="isolationDomain"
  >
    <div v-if="!popup">
      <a
        class="ui blue ribbon label"
        href="https://github.com/stoically/temporary-containers/wiki/Per-domain-Isolation"
        target="_blank"
        style="margin-bottom: 15px"
      >
        <i class="icon-info-circled" /> Per Domain Isolation?
      </a>
    </div>
    <div class="ui form">
      <form
        id="isolationDomainForm"
      >
        <domain-pattern
          id="isolationDomainPattern"
          :tooltip="!popup ? undefined : {hidden: true}"
          :disabled="domainPatternDisabled"
          :domain-pattern.sync="domainPattern"
        />
      </form>
      <div
        id="isolationPerDomainAccordion"
        class="ui accordion"
      >
        <div class="title">
          <h4>
            <i class="dropdown icon" />
            {{ !popup ?
              'Always open in new Temporary Containers' :
              'Always'
            }}
          </h4>
        </div>
        <div
          class="ui content"
          :class="{segment: !popup, 'popup-margin': popup}"
        >
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
                v-model="domain.always.allowedInPermanent"
                type="checkbox"
              >
              <label>
                {{ !popup ?
                  'Allow to load in permanent containers' :
                  'Allow in permanent containers'
                }}
              </label>
            </div>
          </div>
        </div>
        <div class="title">
          <h4>
            <i class="dropdown icon" />
            {{ !popup ?
              'Navigating in tabs should open new Temporary Containers' :
              'Navigating'
            }}
          </h4>
        </div>
        <div
          class="ui content"
          :class="{segment: !popup, 'popup-margin': popup}"
        >
          <div class="field">
            <select
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
                {{ !popup ?
                  'If the navigation target domain does not exactly match the active tabs domain - Subdomains also get isolated' :
                  'Not exact same domain'
                }}
              </option>
              <option value="notsamedomain">
                {{ !popup ?
                  'If the Navigation Target domain does not match the active tabs domain - Subdomains won\'t get isolated' :
                  'Not same domain'
                }}
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
            {{ !popup ?
              'Mouse Clicks on links should open new Temporary Containers' :
              'Mouse Clicks'
            }}
          </h4>
        </div>
        <div
          class="ui content"
          :class="{segment: !popup, 'popup-margin': popup}"
        >
          <div class="field">
            <label>Middle Mouse</label>
            <select
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
                {{ !popup ?
                  'If the clicked link domain does not exactly match the active tabs domain - Subdomains also get isolated' :
                  'Not exact same domain'
                }}
              </option>
              <option value="notsamedomain">
                {{ !popup ?
                  'If the clicked link domain does not match the active tabs domain - Subdomains won\'t get isolated' :
                  'Not same domain'
                }}
              </option>
              <option value="never">
                Never
              </option>
            </select>
          </div>
          <div class="field">
            <label>Ctrl/Cmd+Left Mouse</label>
            <select
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
                {{ !popup ?
                  'If the clicked link domain does not exactly match the active tabs domain - Subdomains also get isolated' :
                  'Not exact same domain'
                }}
              </option>
              <option value="notsamedomain">
                {{ !popup ?
                  'If the clicked link domain does not match the active tabs domain - Subdomains won\'t get isolated' :
                  'Not same domain'
                }}
              </option>
              <option value="never">
                Never
              </option>
            </select>
          </div>
          <div class="field">
            <label>Left Mouse</label>
            <select
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
                {{ !popup ?
                  'If the clicked link domain does not exactly match the active tabs domain - Subdomains also get isolated' :
                  'Not exact same domain'
                }}
              </option>
              <option value="notsamedomain">
                {{ !popup ?
                  'If the clicked link domain does not match the active tabs domain - Subdomains won\'t get isolated' :
                  'Not same domain'
                }}
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
            {{ !popup ?
              'Exclude target domains' :
              'Exclude domains'
            }}
          </h4>
        </div>
        <div
          class="ui content"
          :class="{segment: !popup, 'popup-exclude-margin': popup}"
        >
          <div class="field">
            <form
              id="isolationDomainExcludeDomainsForm"
              class="ui form"
            >
              <domain-pattern
                id="isolationDomainExcludeDomainPattern"
                :tooltip="!popup ? {position: 'top left'} : {hidden: true}"
                :domain-pattern.sync="excludeDomainPattern"
              />
              <div class="field">
                <button class="ui button primary">
                  Exclude
                </button>
              </div>
            </form>
            <div style="margin-top: 20px;">
              <h3>Excluded domains</h3>
              <div v-if="!Object.keys(domain.excluded).length">
                No domains excluded
              </div>
              <div v-else>
                <div
                  v-for="(_, excludedDomainPattern) in domain.excluded"
                  :key="excludedDomainPattern"
                >
                  <button
                    class="ui right negative small button"
                    style="margin-top: 10px"
                    data-tooltip="Remove"
                    @click="removeExcludedDomain(excludedDomainPattern)"
                  >
                    <i class="icon-trash-empty" />
                  </button>
                  {{ excludedDomainPattern }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <br>
    <div class="field">
      <button
        form="isolationDomainForm"
        class="ui button primary"
        :disabled="!domainPattern.trim()"
      >
        {{ editing ? 'Done editing' : 'Add' }}
        {{ domainPattern }}
      </button>
    </div>
    <br>
    <div :class="{'ui accordion': popup}">
      <div :class="{title: popup}">
        <h3>
          <i
            v-if="popup"
            class="dropdown icon"
          />
          Per Domain Patterns
        </h3>
      </div>
      <div
        v-if="!Object.keys(preferences.isolation.domain).length"
        :class="{'ui content': popup}"
      >
        No domains added yet
      </div>
      <div
        v-else
        :class="{'ui content': popup}"
      >
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