import Vue from 'vue';

import DomainPattern from '../domainpattern.vue';
import Settings from './settings.vue';
import { App } from '~/ui/root';

export default Vue.extend({
  components: {
    DomainPattern,
    Settings,
  },
  props: {
    app: {
      type: Object as () => App,
      required: true,
    },
  },
  data() {
    return {
      preferences: this.app.preferences,
      storage: this.app.storage,
      popup: this.app.popup,
      show: false,
      excludeDomainPattern: '',
    };
  },
  async mounted() {
    this.$nextTick(() => {
      $('#isolationGlobal .ui.accordion').accordion({
        ...(this.popup
          ? {
              animateChildren: false,
              duration: 0,
            }
          : {}),
        exclusive: false,
      });
      $('#isolationGlobal .ui.dropdown').dropdown();
      $('#isolationGlobal .ui.checkbox').checkbox();

      $('#isolationGlobalAccordion').accordion('open', 0);

      if (
        this.preferences.isolation.global.mouseClick.middle.action !==
          'never' ||
        this.preferences.isolation.global.mouseClick.ctrlleft.action !==
          'never' ||
        this.preferences.isolation.global.mouseClick.left.action !== 'never'
      ) {
        $('#isolationGlobalAccordion').accordion('open', 1);
      }

      if (
        Object.keys(this.preferences.isolation.global.excludedContainers).length
      ) {
        $('#isolationGlobalAccordion').accordion('open', 2);
      }

      if (Object.keys(this.preferences.isolation.global.excluded).length) {
        $('#isolationGlobalAccordion').accordion('open', 3);
      }

      this.show = true;
    });

    const excludeContainers: {
      name: string;
      value: string;
      selected: boolean;
    }[] = [];
    const containers = await browser.contextualIdentities.query({});
    containers.map(container => {
      if (this.storage.tempContainers[container.cookieStoreId]) {
        return;
      }
      excludeContainers.push({
        name: container.name,
        value: container.cookieStoreId,
        selected: !!this.preferences.isolation.global.excludedContainers[
          container.cookieStoreId
        ],
      });
    });
    $('#isolationGlobalExcludeContainers').dropdown({
      placeholder: !this.popup
        ? 'Select Permanent Containers to Exclude from Isolation'
        : 'Permanent Containers to Exclude',
      values: excludeContainers,
      onAdd: addedContainer => {
        if (
          this.preferences.isolation.global.excludedContainers[addedContainer]
        ) {
          return;
        }
        this.$set(
          this.preferences.isolation.global.excludedContainers,
          addedContainer,
          {}
        );
      },
      onRemove: removedContainer => {
        this.$delete(
          this.preferences.isolation.global.excludedContainers,
          removedContainer
        );
      },
    });

    $('#isolationGlobalExcludeDomainsForm').form({
      fields: {
        isolationGlobalExcludeDomainPattern: 'empty',
      },
      onSuccess: event => {
        event.preventDefault();
        this.$set(
          this.preferences.isolation.global.excluded,
          this.excludeDomainPattern,
          {}
        );
        this.excludeDomainPattern = '';
      },
    });
  },
  methods: {
    removeExcludedDomain(excludedDomainPattern: string): void {
      this.$delete(
        this.preferences.isolation.global.excluded,
        excludedDomainPattern
      );
    },
  },
});
