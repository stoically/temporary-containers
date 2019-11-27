<script>
export { default } from './global.ts';
</script>

<template>
  <div v-show="show" id="isolationGlobal">
    <div class="ui form">
      <div id="isolationGlobalAccordion" class="ui accordion">
        <div class="field">
          <div class="title">
            <h4>
              <i class="dropdown icon" />
              Navigation
            </h4>
          </div>
          <div
            class="content"
            :class="{ 'ui segment': !popup, 'popup-margin': popup }"
          >
            <settings
              label="Target Domain"
              :action.sync="preferences.isolation.global.navigation.action"
            />
          </div>
        </div>
        <div class="field">
          <div class="title">
            <h4>
              <i class="dropdown icon" />
              Mouse Click
            </h4>
          </div>
          <div
            class="content"
            :class="{ 'ui segment': !popup, 'popup-margin': popup }"
          >
            <settings
              label="Middle Mouse"
              :action.sync="
                preferences.isolation.global.mouseClick.middle.action
              "
            />
            <settings
              label="Ctrl/Cmd+Left Mouse"
              :action.sync="
                preferences.isolation.global.mouseClick.ctrlleft.action
              "
            />
            <settings
              label="Left Mouse"
              :action.sync="preferences.isolation.global.mouseClick.left.action"
            />
          </div>
        </div>
        <div class="field">
          <div class="title">
            <h4>
              <i class="dropdown icon" />
              Exclude Permanent Containers
            </h4>
          </div>
          <div
            class="content"
            :class="{ 'ui segment': !popup, 'popup-margin': popup }"
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
        </div>
        <div class="field">
          <div class="title">
            <h4>
              <i class="dropdown icon" />
              Exclude Target Domains
            </h4>
          </div>
          <div
            class="content"
            :class="{ 'ui segment': !popup, 'popup-margin': popup }"
          >
            <div class="field">
              <form id="isolationGlobalExcludeDomainsForm" class="ui form">
                <domain-pattern
                  id="isolationGlobalExcludeDomainPattern"
                  :tooltip="
                    !popup ? { position: 'top left' } : { hidden: true }
                  "
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
                <div
                  v-if="
                    !Object.keys(preferences.isolation.global.excluded).length
                  "
                >
                  No domains excluded
                </div>
                <div v-else>
                  <div
                    v-for="(_, excludedDomainPattern) in preferences.isolation
                      .global.excluded"
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
  </div>
</template>
