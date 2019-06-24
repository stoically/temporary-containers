<template>
  <div class="ui tab segment" data-tab="general">
    <form class="ui form">
      <div class="field" id="automaticModeField">
        <div class="ui checkbox">
          <input type="checkbox" id="automaticMode">
          <label>Automatic Mode</label>
        </div>
        <span class="float right">
          <a id="automaticModeInfo" class="icon-info-circled" href="https://github.com/stoically/temporary-containers/wiki/Automatic-Mode" target="_blank"></a>
        </span>
      </div>

      <div class="field" id="notificationsField">
        <div class="ui checkbox" id="notifications">
          <input type="checkbox" id="notificationsCheckbox">
          <label>Notifications when Temporary Containers are deleted</label>
        </div>
      </div>
      <div class="field">
        <label>Container Name Prefix</label>
        <input type="text" id="containerNamePrefix">
      </div>
      <div class="field">
        <label>Container Color</label>
        <select id="containerColor" class="ui fluid dropdown">
          <option value="blue">blue</option>
          <option value="turquoise">turquoise</option>
          <option value="green">green</option>
          <option value="yellow">yellow</option>
          <option value="orange">orange</option>
          <option value="red">red</option>
          <option value="pink">pink</option>
          <option value="purple">purple</option>
        </select>
      </div>
      <div class="field">
          <div class="ui checkbox">
            <input type="checkbox" id="containerColorRandom">
            <label>Random Container Color</label>
          </div>
      </div>
      <div class="field">
        <label>Container Icon</label>
        <select id="containerIcon" class="ui fluid dropdown">
          <option value="fingerprint">fingerprint</option>
          <option value="briefcase">briefcase</option>
          <option value="dollar">dollar</option>
          <option value="cart">cart</option>
          <option value="circle">circle</option>
          <option value="gift">gift</option>
          <option value="vacation">vacation</option>
          <option value="food">food</option>
          <option value="fruit">fruit</option>
          <option value="pet">pet</option>
          <option value="tree">tree</option>
          <option value="chill">chill</option>
        </select>
      </div>
      <div class="field">
        <div class="ui checkbox">
          <input type="checkbox" id="containerIconRandom">
          <label>Random Container Icon</label>
        </div>
      </div>
      <div class="field">
        <label>Container Number</label>
        <select id="containerNumberMode" class="ui fluid dropdown">
          <option value="keep">Keep counting (default)</option>
          <option value="reuse">Reuse available numbers</option>
        </select>
      </div>
      <div class="field" data-tooltip='"X minutes" lets you "undo close tabs" in that timeframe'>
        <label>Delete no longer needed Temporary Containers</label>
        <select id="containerRemoval" class="ui fluid dropdown">
          <option value="15minutes">15 minutes after the last tab in it closes (default)</option>
          <option value="5minutes">5 minutes after the last tab in it closes</option>
          <option value="2minutes">2 minutes after the last tab in it closes</option>
          <option value="instant">After the last tab in it closes</option>
        </select>
      </div>
      <div class="field" data-tooltip="When switching back to default you might need to restart the browser depending on your theme">
        <label>Toolbar Icon Color</label>
        <select id="iconColor" class="ui fluid dropdown">
          <option value="default">default</option>
          <option value="black-simple">black (simple)</option>
          <option value="blue-simple">blue (simple)</option>
          <option value="red-simple">red (simple)</option>
          <option value="white-simple">white (simple)</option>
        </select>
      </div>
      <div class="field">
        <button id="saveContainerPreferences" class="ui button primary">Save</button>
      </div>
    </form>
  </div>
</template>
