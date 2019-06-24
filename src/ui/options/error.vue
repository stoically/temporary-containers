<template>
  <div id="preferenceserror" class="ui tiny modal">
    <h2 class="ui header">
      Error while loading preferences.
    </h2>
    <div id="preferenceserrorcontent" class="content">
      If you just installed the Temporary Containers Add-on you need to
      reset its storage by pressing the following button.<br><br>
      <button id="resetStorage" class="ui button negative primary" data-tooltip="No confirmation">Reset storage</button><br><br>
      If you already had the Add-on installed you probably just need to
      restart Firefox. If the Error persists you might need to reset the
      storage.<br>
      <br>Sorry about that. You can read about why this can happen
      <a href="https://github.com/stoically/temporary-containers/issues/68" target="_blank">here</a>.
      <div class="content" id="preferenceserrordesc">
      </div>
    </div>
  </div>
</template>
