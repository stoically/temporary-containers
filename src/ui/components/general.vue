<script>
export { default } from './general.ts';
</script>

<template>
  <div v-if="initialized" v-show="show" id="general">
    <div class="ui form">
      <div id="automaticModeField" class="field">
        <div class="ui checkbox">
          <input
            id="automaticMode"
            v-model="preferences.automaticMode.active"
            type="checkbox"
          />
          <label
            ><span
              data-glossary="Automatic Mode"
              :data-glossary-label="t('automaticMode')"
          /></label>
        </div>
      </div>
      <div id="popupField" class="field">
        <div class="ui checkbox">
          <input
            id="browserActionPopup"
            v-model="preferences.browserActionPopup"
            type="checkbox"
          />
          <label
            ><span
              id="popupbug"
              data-glossary="Toolbar Popup"
              data-glossary-label="Show popup when clicking the toolbar icon"
          /></label>
        </div>
      </div>
      <div class="field">
        <div id="notifications" class="ui checkbox">
          <input
            id="notificationsCheckbox"
            v-model="preferences.notifications"
            type="checkbox"
          />
          <label>{{ t('optionsGeneralNotifications') }}</label>
        </div>
      </div>
      <div class="field">
        <label>{{ t('optionsGeneralContainerNamePrefix') }}</label>
        <input
          id="containerNamePrefix"
          v-model="preferences.container.namePrefix"
          type="text"
        />
      </div>
      <div id="containerColor" class="field">
        <label v-if="!preferences.container.colorRandom">
          {{ t('optionsGeneralContainerColor') }}
        </label>
        <label v-else>
          Container Colors excluded from random selection
        </label>
        <div v-show="!preferences.container.colorRandom">
          <select
            v-model="preferences.container.color"
            class="ui fluid dropdown"
          >
            <option
              v-for="containerColor in containerColors"
              :key="containerColor.id"
              :value="containerColor.id"
            >
              {{ containerColor.text }}
            </option>
          </select>
        </div>
        <div
          v-show="preferences.container.colorRandom"
          id="containerColorRandomExcluded"
          class="ui dropdown fluid selection multiple"
        >
          <div class="text" />
          <i class="dropdown icon" />
        </div>
      </div>
      <div class="field">
        <div class="ui checkbox">
          <input
            id="containerColorRandom"
            v-model="preferences.container.colorRandom"
            type="checkbox"
          />
          <label>{{ t('optionsGeneralContainerRandomColor') }}</label>
        </div>
      </div>
      <div id="containerIcon" class="field">
        <label v-if="!preferences.container.iconRandom">
          {{ t('optionsGeneralContainerIcon') }}
        </label>
        <label v-else>
          Container Icons excluded from random selection
        </label>
        <div v-show="!preferences.container.iconRandom">
          <select
            v-model="preferences.container.icon"
            class="ui fluid dropdown"
          >
            <option
              v-for="containerIcon in containerIcons"
              :key="containerIcon.id"
              :value="containerIcon.id"
            >
              {{ containerIcon.text }}
            </option>
          </select>
        </div>
        <div
          v-show="preferences.container.iconRandom"
          id="containerIconRandomExcluded"
          class="ui dropdown fluid selection multiple"
        >
          <div class="text" />
          <i class="dropdown icon" />
        </div>
      </div>
      <div class="field">
        <div class="ui checkbox">
          <input
            id="containerIconRandom"
            v-model="preferences.container.iconRandom"
            type="checkbox"
          />
          <label>{{ t('optionsGeneralContainerIconRandom') }}</label>
        </div>
      </div>
      <div class="field">
        <label>{{ t('optionsGeneralContainerNumber') }}</label>
        <select
          id="containerNumberMode"
          v-model="preferences.container.numberMode"
          class="ui fluid dropdown"
        >
          <option value="keep">
            {{ t('optionsGeneralContainerNumberKeepCounting') }}
          </option>
          <option value="keepuntilrestart">
            {{ t('optionsGeneralContainerNumberKeepCountingUntilRestart') }}
          </option>
          <option value="reuse">
            {{ t('optionsGeneralContainerNumberReuseNumbers') }}
          </option>
          <option value="hide">
            {{ t('optionsGeneralContainerNumberHide') }}
          </option>
        </select>
      </div>
      <div class="field">
        {{ app.tempContainerCounter }}
        <div
          v-if="
            preferences.container.numberMode === 'keep' &&
              app.storage.tempContainerCounter > 0
          "
        >
          <button class="ui tiny button" @click="resetContainerNumber()">
            Reset current number {{ app.storage.tempContainerCounter }} to 0
          </button>
        </div>
      </div>
      <div
        class="field"
        :data-tooltip="t('optionsGeneralContainerRemovalTooltip')"
      >
        <label>{{ t('optionsGeneralContainerRemoval') }}</label>
        <select
          id="containerRemoval"
          v-model="preferences.container.removal"
          class="ui fluid dropdown"
        >
          <option :value="900000">
            {{ t('optionsGeneralContainerRemoval15Minutes') }}
          </option>
          <option :value="300000">
            {{ t('optionsGeneralContainerRemoval5Minutes') }}
          </option>
          <option :value="120000">
            {{ t('optionsGeneralContainerRemoval2Minutes') }}
          </option>
          <option :value="0">
            {{ t('optionsGeneralContainerRemovalInstant') }}
          </option>
        </select>
      </div>
      <div
        class="field"
        :data-tooltip="t('optionsGeneralToolbarIconColorTooltip')"
      >
        <label>{{ t('optionsGeneralToolbarIconColor') }}</label>
        <select
          id="iconColor"
          v-model="preferences.iconColor"
          class="ui fluid dropdown"
        >
          <option
            v-for="toolbarIconColor in toolbarIconColors"
            :key="toolbarIconColor.id"
            :value="toolbarIconColor.id"
          >
            {{ toolbarIconColor.text }}
          </option>
        </select>
      </div>
    </div>
  </div>
</template>
