<script>
import DomainPattern from '../domainpattern';

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
        'Select permanent containers to exclude from Isolation' :
        'Permanent containers to exclude'
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
    <a
      class="ui blue ribbon label"
      href="https://github.com/stoically/temporary-containers/wiki/Global-Isolation"
      target="_blank"
    >
      <i class="icon-info-circled" /> Global Isolation?
    </a>
    <div
      v-if="popup"
      style="margin-top: 10px"
    />
    <div
      v-if="!popup"
      class="ui small message"
    >
      Isolation lets you configure that navigating in tabs ("web browsing") should
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
            {{ !popup ?
              'Navigating in Tabs should open new Temporary Containers' :
              'Navigating'
            }}
          </h4>
        </div>
        <div
          class="content"
          :class="{'ui segment': !popup, 'popup-margin': popup}"
        >
          <div class="field">
            <select
              v-model="preferences.isolation.global.navigation.action"
              class="ui fluid dropdown"
            >
              <option value="never">
                Never
              </option>
              <option value="notsamedomainexact">
                {{ !popup ?
                  'If the navigation target domain does not exactly match the active tabs domain - Subdomains also get isolated' :
                  'Not exact same domain'
                }}
              </option>
              <option value="notsamedomain">
                {{ !popup ?
                  'If the navigation target domain does not match the active tabs domain - Subdomains won\'t get isolated' :
                  'Not same domain'
                }}
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
            {{ !popup ?
              'Mouse Clicks on links should open new Temporary Containers' :
              'Mouse Clicks'
            }}
          </h4>
        </div>
        <div
          class="content"
          :class="{'ui segment': !popup, 'popup-margin': popup}"
        >
          <div
            v-if="!popup"
            class="ui small message"
          >
            The Navigating in Tabs configuration also covers mouse clicks (since they result in a navigation), so you might not need to additionally
            configure mouse clicks, unless you want a more strict configuration for specific mouse clicks. Navigating in Tabs is also more reliable,
            so you should prefer that if possible.
          </div>
          <div class="field">
            <label>Middle Mouse</label>
            <select
              v-model="preferences.isolation.global.mouseClick.middle.action"
              class="ui fluid dropdown"
            >
              <option value="never">
                Never
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
              <option value="always">
                Always
              </option>
            </select>
          </div>
        </div>
        <div class="title">
          <h4>
            <i class="dropdown icon" />
            {{ !popup ?
              'Exclude permanent containers from Isolation' :
              'Exclude permanent containers'
            }}
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
            {{ !popup ?
              'Exclude target domains from Isolation' :
              'Exclude target domains'
            }}
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
