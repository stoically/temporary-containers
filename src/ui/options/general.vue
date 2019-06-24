<template>
  <div class="ui tab segment" data-tab="general">
    <form class="ui form">
      <div class="field" id="automaticModeField">
        <div class="ui checkbox">
          <input type="checkbox" id="automaticMode">
          <label>{{t('automaticMode')}}</label>
        </div>
        <span class="float right">
          <a id="automaticModeInfo" class="icon-info-circled" href="https://github.com/stoically/temporary-containers/wiki/Automatic-Mode" target="_blank"></a>
        </span>
      </div>

      <div class="field" id="notificationsField">
        <div class="ui checkbox" id="notifications">
          <input type="checkbox" id="notificationsCheckbox">
          <label>{{t('optionsGeneralNotifications')}}</label>
        </div>
      </div>
      <div class="field">
        <label>{{t('optionsGeneralContainerNamePrefix')}}</label>
        <input type="text" id="containerNamePrefix">
      </div>
      <div class="field">
        <label>{{t('optionsGeneralContainerColor')}}</label>
        <select id="containerColor" class="ui fluid dropdown">
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
            <input type="checkbox" id="containerColorRandom">
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
          <input type="checkbox" id="containerIconRandom">
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
        <label>{{t('optionsGeneralContainerDelete')}}</label>
        <select id="containerRemoval" class="ui fluid dropdown">
          <option value="15minutes">{{t('optionsGeneralContainerDeleteTime15Minutes')}}</option>
          <option value="5minutes">{{t('optionsGeneralContainerDeleteTime5Minutes')}}</option>
          <option value="2minutes">{{t('optionsGeneralContainerDeleteTime2Minutes')}}</option>
          <option value="instant">{{t('optionsGeneralContainerDeleteTimeInstant')}}</option>
        </select>
      </div>
      <div class="field" :data-tooltip="t('optionsGeneralToolbarIconColorTooltip')">
        <label></label>
        <select id="iconColor" class="ui fluid dropdown">
          <option value="default">{{t('optionsGeneralToolbarIconColorDefault')}}</option>
          <option value="black-simple">{{t('optionsGeneralToolbarIconColorBlackSimple')}}</option>
          <option value="blue-simple">{{t('optionsGeneralToolbarIconColorBlueSimple')}}</option>
          <option value="red-simple">{{t('optionsGeneralToolbarIconColorRedSimple')}}</option>
          <option value="white-simple">{{t('optionsGeneralToolbarIconColorWhiteSimple')}}</option>
        </select>
      </div>
      <div class="field">
        <button id="saveContainerPreferences" class="ui button primary">{{t('optionsSave')}}</button>
      </div>
    </form>
  </div>
</template>
