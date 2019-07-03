<script>
import DomainPattern from '../domainpattern';
import IntroHint from './helper/intro-hint';
import MouseclickHint from './helper/mouseclick-hint';

export default {
  components: {
    DomainPattern,
    IntroHint,
    MouseclickHint
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
      storage: this.app.storage,
      popup: this.app.popup,
      show: false,
      excludeDomainPattern: ''
    };
  },
  async mounted() {

    this.$nextTick(() => {
      $('#isolationGlobal .ui.accordion').accordion({
        ...this.popup ? {
          animateChildren: false,
          duration: 0} : {},
        exclusive: false
      });
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

      if (Object.keys(this.preferences.isolation.global.excluded).length) {
        $('#isolationGlobalAccordion').accordion('open', 3);
      }

      this.show = true;
    });

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
      placeholder: !this.popup ?
        'Select Permanent Containers to Exclude from Isolation' :
        'Permanent Containers to Exclude'
      ,
      values: excludeContainers,
      onAdd: (addedContainer) => {
        if (this.preferences.isolation.global.excludedContainers[addedContainer]) {
          return;
        }
        this.$set(this.preferences.isolation.global.excludedContainers, addedContainer, {});
      },
      onRemove: (removedContainer) => {
        this.$delete(this.preferences.isolation.global.excludedContainers, removedContainer, {});
      }
    });

    $('#isolationGlobalExcludeDomainsForm').form({
      fields: {
        isolationGlobalExcludeDomainPattern: 'empty'
      },
      onSuccess: (event) => {
        event.preventDefault();
        this.$set(this.preferences.isolation.global.excluded, this.excludeDomainPattern, {});
        this.excludeDomainPattern = '';
      }
    });

  },
  methods: {
    removeExcludedDomain(excludedDomainPattern) {
      this.$delete(this.preferences.isolation.global.excluded, excludedDomainPattern);
    }
  }
};
</script>

<template>
  <div
    v-show="show"
    id="isolationGlobal"
  >
    <div class="ui form">
      <intro-hint :app="app" />
      <div
        id="isolationGlobalAccordion"
        class="ui accordion"
      >
        <div
          class="title"
        >
          <h4>
            <i class="dropdown icon" />
            Navigation
          </h4>
        </div>
        <div
          class="content"
          :class="{'ui segment': !popup, 'popup-margin': popup}"
        >
          <div class="field">
            <label>Target Domain</label>
            <select
              v-model="preferences.isolation.global.navigation.action"
              class="ui fluid dropdown"
            >
              <option value="never">
                Never
              </option>
              <option value="notsamedomain">
                Different from Tab Domain & Subdomains
              </option>
              <option value="notsamedomainexact">
                Different from Tab Domain
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
            Mouse Click
          </h4>
        </div>
        <div
          class="content"
          :class="{'ui segment': !popup, 'popup-margin': popup}"
        >
          <mouseclick-hint :app="app" />
          <div class="field">
            <label>Middle Mouse</label>
            <select
              v-model="preferences.isolation.global.mouseClick.middle.action"
              class="ui fluid dropdown"
            >
              <option value="never">
                Never
              </option>
              <option value="notsamedomain">
                Different from Tab Domain & Subdomains
              </option>
              <option value="notsamedomainexact">
                Different from Tab Domain
              </option>
              <option value="always">
                Always
              </option>
            </select>
          </div>
          <div class="field">
            <label>Ctrl/Cmd+Left Mouse</label>
            <select
              v-model="preferences.isolation.global.mouseClick.ctrlleft.action"
              class="ui fluid dropdown"
            >
              <option value="never">
                Never
              </option>
              <option value="notsamedomain">
                Different from Tab Domain & Subdomains
              </option>
              <option value="notsamedomainexact">
                Different from Tab Domain
              </option>
              <option value="always">
                Always
              </option>
            </select>
          </div>
          <div class="field">
            <label>Left Mouse</label>
            <select
              v-model="preferences.isolation.global.mouseClick.left.action"
              class="ui fluid dropdown"
            >
              <option value="never">
                Never
              </option>
              <option value="notsamedomain">
                Different from Tab Domain & Subdomains
              </option>
              <option value="notsamedomainexact">
                Different from Tab Domain
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
            Exclude Permanent Containers
          </h4>
        </div>
        <div
          class="content"
          :class="{'ui segment': !popup, 'popup-margin': popup}"
        >
          <div class="field">
            <div
              id="isolationGlobalExcludeContainers"
              class="ui dropdown fluid selection multiple"
              :style="popup ? 'max-width: 280px' : ''"
            >
              <div class="text" />
              <i class="dropdown icon" />
            </div>
          </div>
        </div>
        <div class="title">
          <h4>
            <i class="dropdown icon" />
            Exclude Target Domains
          </h4>
        </div>
        <div
          class="content"
          :class="{'ui segment': !popup, 'popup-margin': popup}"
        >
          <div class="field">
            <form
              id="isolationGlobalExcludeDomainsForm"
              class="ui form"
            >
              <domain-pattern
                id="isolationGlobalExcludeDomainPattern"
                :tooltip="!popup ? {position: 'top left'} : {hidden: true}"
                :domain-pattern.sync="excludeDomainPattern"
                :exclusion="true"
              />
              <div class="field">
                <button class="ui button primary">
                  Exclude
                </button>
              </div>
            </form>
            <div style="margin-top: 20px;">
              <div v-if="!Object.keys(preferences.isolation.global.excluded).length">
                No domains excluded
              </div>
              <div v-else>
                <div
                  v-for="(_, excludedDomainPattern) in preferences.isolation.global.excluded"
                  :key="excludedDomainPattern"
                >
                  <div style="margin-top: 5px" />
                  <span
                    :data-tooltip="`Remove ${excludedDomainPattern}`"
                    data-position="right center"
                    style="color: red; cursor: pointer;"
                    @click="removeExcludedDomain(excludedDomainPattern)"
                  >
                    <i class="icon-trash-empty" />
                  </span>
                  {{ excludedDomainPattern }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
