<script>
export { default } from './perdomain.ts';
</script>

<style>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s;
}
.fade-enter,
.fade-leave-to {
  opacity: 0;
}
</style>

<template>
  <div v-show="show" id="isolationDomain">
    <div class="ui form">
      <form id="isolationDomainForm">
        <domain-pattern
          id="isolationDomainPattern"
          :tooltip="!popup ? undefined : { hidden: true }"
          :domain-pattern.sync="domain.pattern"
        />
      </form>
      <div
        id="isolationPerDomainAccordion"
        style="margin-top: 15px"
        :style="empty ? 'opacity: 0.3; pointer-events: none' : ''"
        class="ui accordion"
      >
        <div class="title">
          <h4>
            <i class="dropdown icon" />
            Always open in
          </h4>
        </div>
        <div
          class="content"
          :class="{ 'ui segment': !popup, 'popup-margin': popup }"
        >
          <div>
            <select
              id="isolationDomainAlways"
              v-model="domain.always.action"
              class="ui fluid dropdown"
            >
              <option value="disabled">
                Disabled
              </option>
              <option value="enabled">
                Enabled
              </option>
            </select>
            <div v-show="domain.always.action === 'enabled'">
              <div class="ui checkbox" style="margin-top: 14px">
                <input
                  v-model="domain.always.allowedInPermanent"
                  type="checkbox"
                />
                <label>
                  {{
                    !popup
                      ? 'Disable if Navigation in Permanent Containers'
                      : 'Disable in Permanent Containers'
                  }}
                </label>
              </div>
              <div />
              <div class="ui checkbox" style="margin-top: 14px">
                <input
                  v-model="domain.always.allowedInTemporary"
                  type="checkbox"
                />
                <label>
                  {{
                    !popup
                      ? 'Disable if Navigation in Temporary Containers'
                      : 'Disable in Temporary Containers'
                  }}
                </label>
              </div>
            </div>
          </div>
        </div>
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
            :perdomain="true"
            :action.sync="domain.navigation.action"
          />
        </div>
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
            :perdomain="true"
            :action.sync="domain.mouseClick.middle.action"
          />
          <settings
            label="Ctrl/Cmd+Left Mouse"
            :perdomain="true"
            :action.sync="domain.mouseClick.ctrlleft.action"
          />
          <settings
            label="Left Mouse"
            :perdomain="true"
            :action.sync="domain.mouseClick.left.action"
          />
        </div>
        <div class="title">
          <h4>
            <i class="dropdown icon" />
            Exclude Target Domains
          </h4>
        </div>
        <div
          class="content popup-exclude-margin"
          :class="{ 'ui segment': !popup, 'popup-margin': popup }"
        >
          <div>
            <div class="field">
              <form id="isolationDomainExcludeDomainsForm" class="ui form">
                <domain-pattern
                  id="isolationDomainExcludeDomainPattern"
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
                <div v-if="!Object.keys(domain.excluded).length">
                  No Domains Excluded
                </div>
                <div v-else>
                  <div
                    v-for="(_, excludedDomainPattern) in domain.excluded"
                    :key="excludedDomainPattern"
                  >
                    <div style="margin-top: 5px" />
                    <span
                      :data-tooltip="Remove"
                      style="margin-top: 10px; color: red; cursor: pointer;"
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
    <br />
    <div class="field">
      <button
        form="isolationDomainForm"
        class="ui button primary"
        :disabled="!domain.pattern.trim()"
      >
        <span v-if="editing">
          <transition name="fade">
            <span v-if="saved">
              <i class="check circle icon" />
              Saved
            </span>
            <span v-if="!saved"> Done editing {{ domain.pattern }} </span>
          </transition>
        </span>
        <span v-else> Add {{ domain.pattern }} </span>
      </button>
    </div>
    <br />
    <div id="isolationDomainsAccordion" :class="{ 'ui accordion': popup }">
      <div
        v-if="!Object.keys(isolationDomains).length && !isolationDomainFilter"
        style="margin-top: 10px"
        :class="{ content: popup }"
      >
        No Isolated Domains added yet
      </div>
      <div v-else :class="{ content: popup }">
        <div :class="{ title: popup }">
          <i v-if="popup" class="dropdown icon" />
          <span
            v-if="
              Object.keys(isolationDomains).length > 1 || isolationDomainFilter
            "
            class="ui icon mini input"
            style="margin-right: 10px"
          >
            <input
              ref="isolationDomainFilter"
              v-model="isolationDomainFilter"
              type="text"
              size="15"
              placeholder="Filter Isolated Domains"
              @focus="expandIsolationDomainFilter"
              @click="expandIsolationDomainFilter"
            />
            <i
              class="circular search link icon"
              @click="focusIsolationDomainFilter"
            />
          </span>
          <span v-else>
            <strong>Isolated Domains</strong>
          </span>
        </div>
        <div :class="{ content: popup }">
          <div style="margin-top: 5px" />
          <draggable
            v-model="isolationDomains"
            group="isolationDomains"
            @change="move"
          >
            <div
              v-for="isolatedDomain in isolationDomains"
              :key="isolatedDomain.pattern"
            >
              <span
                :data-tooltip="`Edit ${isolatedDomain.pattern}`"
                style="cursor: pointer;"
                data-position="right center"
                @click="edit(isolatedDomain._index)"
              >
                <i class="icon-pencil" style="color: #2185d0" />
              </span>
              <span
                :data-tooltip="`Remove ${isolatedDomain.pattern}`"
                data-position="right center"
                style="color: red; cursor: pointer;"
                @click="remove(isolatedDomain._index, isolatedDomain.pattern)"
              >
                <i class="icon-trash-empty" />
              </span>
              <span
                :data-tooltip="
                  !popup && isolationDomains.length > 1
                    ? 'Drag up/down - First in the list matches first'
                    : undefined
                "
                data-position="right center"
                :style="isolationDomains.length > 1 ? 'cursor: grab' : ''"
              >
                <i
                  v-if="isolationDomains.length > 1"
                  class="hand rock icon"
                  style="color: #2185d0; margin-left: 3px; opacity: 0.8"
                />
              </span>
              {{ isolatedDomain.pattern }}
            </div>
          </draggable>
        </div>
      </div>
    </div>
  </div>
</template>
