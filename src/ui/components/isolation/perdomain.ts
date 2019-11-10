import Vue from 'vue';
import DomainPattern from '../domainpattern.vue';
import Settings from './settings.vue';

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
Array.prototype.move = function(from, to) {
  this.splice(to, 0, this.splice(from, 1)[0]);
};

const domainDefaults = {
  pattern: '',
  always: {
    action: 'disabled',
    allowedInPermanent: false,
    allowedInTemporary: false,
  },
  navigation: {
    action: 'global',
  },
  mouseClick: {
    middle: {
      action: 'global',
    },
    ctrlleft: {
      action: 'global',
    },
    left: {
      action: 'global',
    },
  },
  excluded: {},
};

export default Vue.extend({
  components: {
    DomainPattern,
    Settings,
  },
  props: {
    app: {
      type: Object,
      required: true,
    },
  },
  data() {
    return {
      preferences: this.app.preferences,
      popup: this.app.popup,
      domain: this.clone(domainDefaults),
      excludeDomainPattern: '',
      isolationDomainFilter: '',
      editing: false,
      show: false,
      saved: false,
      empty: true,
    };
  },
  computed: {
    isolationDomains() {
      return this.preferences.isolation.domain.reduce(
        (accumulator, isolated, index) => {
          isolated._index = index;
          if (!isolated.pattern.includes(this.isolationDomainFilter)) {
            return accumulator;
          }
          accumulator.push(isolated);
          return accumulator;
        },
        []
      );
    },
  },
  watch: {
    domain: {
      handler(domain) {
        if (this.editing && !domain.pattern.trim()) {
          this.editing = false;
          this.domain = this.clone(domain);
          const domainIndex = this.preferences.isolation.domain.findIndex(
            isolatedDomain => !isolatedDomain.pattern.trim()
          );
          this.$delete(this.preferences.isolation.domain, domainIndex);
        } else if (
          !this.editing &&
          this.preferences.isolation.domain.find(
            _domain => _domain.pattern === domain.pattern
          )
        ) {
          $('#isolationDomainForm').form('validate form');
        } else if (this.editing) {
          if (this.editClicked) {
            this.editClicked = false;
          } else {
            this.saved = true;
            setTimeout(() => {
              this.saved = false;
            }, 1500);
          }
        }
        this.empty = false;
      },
      deep: true,
    },
  },
  async mounted() {
    this.$nextTick(() => {
      $('#isolationDomain .ui.accordion').accordion({
        ...(this.popup
          ? {
              animateChildren: false,
              duration: 0,
            }
          : {}),
        exclusive: false,
      });

      $('#isolationDomain .ui.dropdown').dropdown();
      $('#isolationDomain .ui.checkbox').checkbox();

      this.show = true;
    });

    $.fn.form.settings.rules.domainPattern = value => {
      if (this.editing) {
        this.reset();
        return true;
      } else {
        return !this.preferences.isolation.domain.find(
          domain => domain.pattern === value
        );
      }
    };

    $('#isolationDomainForm').form({
      inline: true,
      fields: {
        isolationDomainPattern: {
          rules: [
            {
              type: 'empty',
              prompt: "Domain Pattern can't be empty",
            },
            {
              type: 'domainPattern',
              prompt: 'Domain Pattern already exists',
            },
          ],
        },
      },
      onSuccess: event => {
        if (event) {
          event.preventDefault();
        }

        if (this.editing) {
          this.reset();
          this.editing = false;
        } else {
          this.domain.pattern = this.domain.pattern.trim();
          this.preferences.isolation.domain.push(this.clone(this.domain));
          this.reset();
        }
      },
    });

    $('#isolationDomainExcludeDomainsForm').form({
      fields: {
        isolationDomainExcludeDomainPattern: 'empty',
      },
      onSuccess: event => {
        event.preventDefault();
        this.$set(this.domain.excluded, this.excludeDomainPattern, {});
        this.excludeDomainPattern = '';
      },
    });

    if (this.popup) {
      if (!this.app.activeTab.url.startsWith('http')) {
        return;
      }
      const isolationDomainIndex = this.preferences.isolation.domain.findIndex(
        domain => domain.pattern === this.app.activeTab.parsedUrl.hostname
      );
      if (isolationDomainIndex >= 0) {
        this.edit(isolationDomainIndex);
      } else {
        this.domain.pattern = this.app.activeTab.parsedUrl.hostname;
      }
    }
  },
  methods: {
    reset() {
      this.domain = this.clone(domainDefaults);
      this.domain.pattern = '';
      this.$nextTick(() => {
        this.empty = true;
      });

      if (!this.preferences.ui.expandPreferences) {
        $('#isolationPerDomainAccordion').accordion('close', 0);
        $('#isolationPerDomainAccordion').accordion('close', 1);
        $('#isolationPerDomainAccordion').accordion('close', 2);
        $('#isolationPerDomainAccordion').accordion('close', 3);
      }
      this.resetDropdowns();
    },
    resetDropdowns() {
      $('#isolationDomain .ui.dropdown').dropdown('destroy');
      this.$nextTick(() => {
        $('#isolationDomain .ui.dropdown').dropdown();
      });
    },
    edit(index) {
      this.editClicked = true;
      this.editing = true;
      this.domain = this.preferences.isolation.domain[index];
      this.resetDropdowns();

      if (!this.preferences.ui.expandPreferences) {
        $('#isolationPerDomainAccordion').accordion(
          this.domain.always.action === domainDefaults.always.action
            ? 'close'
            : 'open',
          0
        );
        $('#isolationPerDomainAccordion').accordion(
          this.domain.navigation.action === domainDefaults.navigation.action
            ? 'close'
            : 'open',
          1
        );
        $('#isolationPerDomainAccordion').accordion(
          this.domain.mouseClick.middle.action ===
            domainDefaults.mouseClick.middle.action &&
            this.domain.mouseClick.ctrlleft.action ===
              domainDefaults.mouseClick.ctrlleft.action &&
            this.domain.mouseClick.left.action ===
              domainDefaults.mouseClick.left.action
            ? 'close'
            : 'open',
          2
        );
        $('#isolationPerDomainAccordion').accordion(
          !Object.keys(this.domain.excluded).length ? 'close' : 'open',
          3
        );
      }
    },
    remove(index, pattern) {
      if (
        window.confirm(`
        Remove ${pattern}?
      `)
      ) {
        this.$delete(this.preferences.isolation.domain, index);
        if (this.editing && this.domain.pattern === pattern) {
          this.reset();
          this.editing = false;
        }
      }
    },
    removeExcludedDomain(excludedDomainPattern) {
      this.$delete(this.domain.excluded, excludedDomainPattern);
    },
    expandIsolationDomainFilter() {
      if (!this.popup) {
        return;
      }

      setTimeout(() => {
        $('#isolationDomainsAccordion').accordion('open', 0);
      }, 200);
    },
    move(event) {
      if (event.moved) {
        this.preferences.isolation.domain.move(
          this.isolationDomains[event.moved.oldIndex]._index,
          this.isolationDomains[event.moved.newIndex]._index
        );
      }
    },
    focusIsolationDomainFilter() {
      this.$refs.isolationDomainFilter.focus();
    },
  },
});
