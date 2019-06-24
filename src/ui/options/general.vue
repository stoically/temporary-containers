<script>
  export default {
    methods: {
      save() {
        if (!this.loaded) {
          return;
        }

        preferences.automaticMode.active = document.querySelector('#automaticMode').checked;
        preferences.notifications = document.querySelector('#notificationsCheckbox').checked;
        preferences.container.namePrefix = document.querySelector('#containerNamePrefix').value;
        preferences.container.color = document.querySelector('#containerColor').value;
        preferences.container.colorRandom = document.querySelector('#containerColorRandom').checked;
        preferences.container.icon = document.querySelector('#containerIcon').value;
        preferences.container.iconRandom = document.querySelector('#containerIconRandom').checked;
        preferences.container.numberMode = document.querySelector('#containerNumberMode').value;
        preferences.container.removal = document.querySelector('#containerRemoval').value;
        preferences.iconColor = document.querySelector('#iconColor').value;

        window.savePreferences();
      },

      async requestNotificationsPermissions() {
        const allowed = await browser.permissions.request({
          permissions: ['notifications']
        });
        if (!allowed) {
          $('#notifications')
            .checkbox('uncheck');
        } else {
          this.save();
        }
      }
    },
    data: () => ({
      loaded: false
    }),
    props: ['preferences'],
    watch: {
      async preferences() {
        if (parseInt((await browser.runtime.getBrowserInfo()).version) >= 67) {
          const toolbarOption = document.createElement('option');
          toolbarOption.value = 'toolbar';
          toolbarOption.text = 'toolbar (black/gray)';
          document.querySelector('#containerColor').add(toolbarOption);

          const fenceOption = document.createElement('option');
          fenceOption.value = 'fence';
          fenceOption.text = 'fence';
          document.querySelector('#containerIcon').add(fenceOption);
        }

        document.querySelector('#automaticMode').checked = preferences.automaticMode.active;
        document.querySelector('#notificationsCheckbox').checked = preferences.notifications;
        document.querySelector('#containerNamePrefix').value = preferences.container.namePrefix;
        $('#containerColor').dropdown('set selected', preferences.container.color);
        document.querySelector('#containerColorRandom').checked = preferences.container.colorRandom;
        $('#containerIcon').dropdown('set selected', preferences.container.icon);
        document.querySelector('#containerIconRandom').checked = preferences.container.iconRandom;
        $('#containerNumberMode').dropdown('set selected', preferences.container.numberMode);
        $('#containerRemoval').dropdown('set selected', preferences.container.removal);
        $('#iconColor').dropdown('set selected', preferences.iconColor);

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

        const notificationsPermission = await browser.permissions.contains({permissions: ['notifications']});
        if (!notificationsPermission) {
          $('#notifications')
            .checkbox('uncheck');
        }

        $('#general .dropdown').dropdown({
          onChange: this.save
        });

        this.loaded = true;
      }
    }
  }
</script>

<template>
  <div id="general" v-show="loaded" class="ui tab segment" data-tab="general">
    <div class="ui form">
      <div class="field" id="automaticModeField">
        <div class="ui checkbox">
          <input v-on:change="save" type="checkbox" id="automaticMode">
          <label>{{t('automaticMode')}}</label>
        </div>
        <span class="float right">
          <a id="automaticModeInfo" class="icon-info-circled" href="https://github.com/stoically/temporary-containers/wiki/Automatic-Mode" target="_blank"></a>
        </span>
      </div>

      <div class="field" id="notificationsField">
        <div class="ui checkbox" v-on:click="requestNotificationsPermissions" id="notifications">
          <input type="checkbox" id="notificationsCheckbox">
          <label>{{t('optionsGeneralNotifications')}}</label>
        </div>
      </div>
      <div class="field">
        <label>{{t('optionsGeneralContainerNamePrefix')}}</label>
        <input type="text" v-on:input="save" id="containerNamePrefix">
      </div>
      <div class="field">
        <label>{{t('optionsGeneralContainerColor')}}</label>
        <select id="containerColor" v-on:change="save" class="ui fluid dropdown">
          <option value="blue">{{t('optionsGeneralContainerColorBlue')}}</option>
          <option value="turquoise">{{t('optionsGeneralContainerColorTurquoise')}}</option>
          <option value="green">{{t('optionsGeneralContainerColorGreen')}}</option>
          <option value="yellow">{{t('optionsGeneralContainerColorYellow')}}</option>
          <option value="orange">{{t('optionsGeneralContainerColorOrange')}}</option>
          <option value="red">{{t('optionsGeneralContainerColorRed')}}</option>
          <option value="pink">{{t('optionsGeneralContainerColorPink')}}</option>
          <option value="purple">{{t('optionsGeneralContainerColorPurple')}}</option>
        </select>
      </div>
      <div class="field">
          <div class="ui checkbox">
            <input v-on:change="save" type="checkbox" id="containerColorRandom">
            <label>{{t('optionsGeneralContainerRandomColor')}}</label>
          </div>
      </div>
      <div class="field">
        <label>{{t('optionsGeneralContainerIcon')}}</label>
        <select id="containerIcon" class="ui fluid dropdown">
          <option value="fingerprint">{{t('optionsGeneralContainerIconFingerprint')}}</option>
          <option value="briefcase">{{t('optionsGeneralContainerIconBriefcase')}}</option>
          <option value="dollar">{{t('optionsGeneralContainerIconDollar')}}</option>
          <option value="cart">{{t('optionsGeneralContainerIconCart')}}</option>
          <option value="circle">{{t('optionsGeneralContainerIconCircle')}}</option>
          <option value="gift">{{t('optionsGeneralContainerIconGift')}}</option>
          <option value="vacation">{{t('optionsGeneralContainerIconVacation')}}</option>
          <option value="food">{{t('optionsGeneralContainerIconFood')}}</option>
          <option value="fruit">{{t('optionsGeneralContainerIconFruit')}}</option>
          <option value="pet">{{t('optionsGeneralContainerIconPet')}}</option>
          <option value="tree">{{t('optionsGeneralContainerIconTree')}}</option>
          <option value="chill">{{t('optionsGeneralContainerIconChill')}}</option>
        </select>
      </div>
      <div class="field">
        <div class="ui checkbox">
          <input v-on:change="save" type="checkbox" id="containerIconRandom">
          <label>{{t('optionsGeneralContainerIconRandom')}}</label>
        </div>
      </div>
      <div class="field">
        <label>{{t('optionsGeneralContainerNumber')}}</label>
        <select id="containerNumberMode" class="ui fluid dropdown">
          <option value="keep">{{t('optionsGeneralContainerNumberKeepCounting')}}</option>
          <option value="reuse">{{t('optionsGeneralContainerNumberReuseNumbers')}}</option>
        </select>
      </div>
      <div class="field" :data-tooltip="t('optionsGeneralContainerDeleteTimeTooltip')">
        <label>{{t('optionsGeneralContainerDeleteTime')}}</label>
        <select id="containerRemoval" class="ui fluid dropdown">
          <option value="15minutes">{{t('optionsGeneralContainerDeleteTime15Minutes')}}</option>
          <option value="5minutes">{{t('optionsGeneralContainerDeleteTime5Minutes')}}</option>
          <option value="2minutes">{{t('optionsGeneralContainerDeleteTime2Minutes')}}</option>
          <option value="instant">{{t('optionsGeneralContainerDeleteTimeInstant')}}</option>
        </select>
      </div>
      <div class="field" :data-tooltip="t('optionsGeneralToolbarIconColorTooltip')">
        <label>{{t('optionsGeneralToolbarIconColor')}}</label>
        <select id="iconColor" class="ui fluid dropdown">
          <option value="default">{{t('optionsGeneralToolbarIconColorDefault')}}</option>
          <option value="black-simple">{{t('optionsGeneralToolbarIconColorBlackSimple')}}</option>
          <option value="blue-simple">{{t('optionsGeneralToolbarIconColorBlueSimple')}}</option>
          <option value="red-simple">{{t('optionsGeneralToolbarIconColorRedSimple')}}</option>
          <option value="white-simple">{{t('optionsGeneralToolbarIconColorWhiteSimple')}}</option>
        </select>
      </div>
    </div>
  </div>
</template>
