<template>
  <div class="ui tab" data-tab="actions">
      <div class="ui segment">
      <div id="actionNone" class="hidden">
        No Actions available for this Tab
      </div>
      <div id="actionOpenInTmpDiv" class="hidden">
        <button id="actionOpenInTmp" class="ui primary button">
          Open Tab URL in new Temporary Container
        </button>
        <br><br>
      </div>
      <div id="actionConvertToPermanentDiv" data-tooltip="No confirmation" class="hidden">
        <button id="actionConvertToPermanent" class="ui negative button">
          Convert to Permanent Container
        </button>
        <br><br>
      </div>
      <div id="actionConvertToRegularDiv" data-tooltip="No confirmation. History isn't deleted." class="hidden">
        <button id="actionConvertToRegular" class="ui negative button">
          Convert to Regular Temporary Container
        </button>
        <br><br>
      </div>
      <div id="actionConvertToTemporaryDiv" data-tooltip="No confirmation" class="hidden">
        <button id="actionConvertToTemporary" class="ui negative button">
          Convert to Temporary Container
        </button>
        <br><br>
      </div>
      <div id="actionOpenInDeletesHistoryTmpDiv" data-tooltip="No confirmation" class="hidden">
        <button id="actionOpenInDeletesHistoryTmp" class="ui negative button">
          Open Tab URL in new "Deletes History Temporary Container"
        </button>
      </div>
    </div>
  </div>
</template>
