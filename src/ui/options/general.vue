<script>
String.prototype.capitalize = function() {
  return this.charAt(0).toUpperCase() + this.slice(1);
};

export default {
  props: {
    app: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      preferences: this.app.preferences,
      permissions: this.app.permissions,
      initialized: false,
      show: false,
      containerColors: [
        'blue',
        'turquoise',
        'green',
        'yellow',
        'orange',
        'red',
        'pink',
        'purple',
      ],
      containerIcons: [
        'fingerprint',
        'briefcase',
        'dollar',
        'cart',
        'circle',
        'gift',
        'vacation',
        'food',
        'fruit',
        'pet',
        'tree',
        'chill'
      ],
      toolbarIconColors: [
        'default',
        'black-simple',
        'blue-simple',
        'red-simple',
        'white-simple'
      ]
    };
  },
  watch: {
    preferences: {
      async handler(newPreferences) {
        // old preferences are not available when deep watching
        // https://github.com/vuejs/vue/issues/2164#issuecomment-432872718
        if (newPreferences.container.colorRandom) {
          $('#containerColor .dropdown').addClass('disabled');
        } else {
          $('#containerColor .dropdown').removeClass('disabled');
        }
        if (newPreferences.container.iconRandom) {
          $('#containerIcon .dropdown').addClass('disabled');
        } else {
          $('#containerIcon .dropdown').removeClass('disabled');
        }
      },
      deep: true
    }
  },
  async mounted() {
    if (parseInt((await browser.runtime.getBrowserInfo()).version) >= 67) {
      this.containerColors.push('toolbar');
      this.containerIcons.push('fence');
    }

    this.containerColors = this.containerColors.map(containerColor => ({
      id: containerColor,
      text: this.t(`optionsGeneralContainerColor${containerColor.capitalize()}`)
    }));

    this.containerIcons = this.containerIcons.map(containerIcon => ({
      id: containerIcon,
      text: this.t(`optionsGeneralContainerIcon${containerIcon.capitalize()}`)
    }));

    this.toolbarIconColors = this.toolbarIconColors.map(toolbarIconColor => ({
      id: toolbarIconColor,
      text: this.t(`optionsGeneralToolbarIconColor${toolbarIconColor.capitalize().replace('-s', 'S')}`)
    }));

    if (!this.permissions.notifications) {
      this.preferences.notifications = false;
    }
    this.initialized = true;

    this.$nextTick(async () => {
      $('#general .ui.dropdown').dropdown();
      $('#general .ui.checkbox').checkbox();

      const automaticModeToolTip =
          '<div style="width:500px;">' +
          'Automatically reopen tabs in new Temporary Containers when<ul>' +
          '<li> Opening a new tab' +
          '<li> A tab tries to load a link in the default container' +
          '<li> An external program opens a link in the browser</ul></div>';

      $('#automaticModeField').popup({
        html: automaticModeToolTip,
        inline: true,
        position: 'bottom left'
      });

      this.show = true;
    });
  }
};
</script>

<template>
  <div
    v-if="initialized"
    v-show="show"
    id="general"
  >
    <div class="ui form">
      <div
        id="automaticModeField"
        class="field"
      >
        <div class="ui checkbox">
          <input
            id="automaticMode"
            v-model="preferences.automaticMode.active"
            type="checkbox"
          >
          <label>{{ t('automaticMode') }}</label>
        </div>
        <span class="float right">
          <a
            id="automaticModeInfo"
            class="icon-info-circled"
            href="https://github.com/stoically/temporary-containers/wiki/Automatic-Mode"
            target="_blank"
          />
        </span>
      </div>

      <div
        id="notificationsField"
        class="field"
      >
        <div
          id="notifications"
          class="ui checkbox"
        >
          <input
            id="notificationsCheckbox"
            v-model="preferences.notifications"
            type="checkbox"
          >
          <label>{{ t('optionsGeneralNotifications') }}</label>
        </div>
      </div>
      <div class="field">
        <label>{{ t('optionsGeneralContainerNamePrefix') }}</label>
        <input
          id="containerNamePrefix"
          v-model="preferences.container.namePrefix"
          type="text"
        >
      </div>
      <div
        id="containerColor"
        class="field"
      >
        <label>{{ t('optionsGeneralContainerColor') }}</label>
        <select
          v-model="preferences.container.color"
          :disabled="preferences.container.colorRandom"
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
      <div class="field">
        <div class="ui checkbox">
          <input
            id="containerColorRandom"
            v-model="preferences.container.colorRandom"
            type="checkbox"
          >
          <label>{{ t('optionsGeneralContainerRandomColor') }}</label>
        </div>
      </div>
      <div
        id="containerIcon"
        class="field"
      >
        <label>{{ t('optionsGeneralContainerIcon') }}</label>
        <select
          v-model="preferences.container.icon"
          :disabled="preferences.container.iconRandom"
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
      <div class="field">
        <div class="ui checkbox">
          <input
            id="containerIconRandom"
            v-model="preferences.container.iconRandom"
            type="checkbox"
          >
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
          <option value="reuse">
            {{ t('optionsGeneralContainerNumberReuseNumbers') }}
          </option>
        </select>
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
          <option value="15minutes">
            {{ t('optionsGeneralContainerRemoval15Minutes') }}
          </option>
          <option value="5minutes">
            {{ t('optionsGeneralContainerRemoval5Minutes') }}
          </option>
          <option value="2minutes">
            {{ t('optionsGeneralContainerRemoval2Minutes') }}
          </option>
          <option value="instant">
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
