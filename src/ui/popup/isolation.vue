<template>
  <div class="ui tab" data-tab="isolation">
    <form class="ui form" id="isolationDomainForm">
      <div id="isolationDomainPatternDiv" class="field">
        <label>Domain Pattern</label>
        <input id="isolationDomainPattern" type="text">
      </div>
      <div class="ui accordion">
        <div class="title active">
          <h4><i class="dropdown icon"></i>
            Always
          </h4>
        </div>
        <div class="content active">
          <div class="field">
            <select id="isolationDomainAlways" class="ui fluid dropdown">
              <option value="enabled">Enabled</option>
              <option value="disabled" selected="selected">Disabled</option>
            </select>
          </div>
          <div class="field">
            <div class="ui checkbox">
              <input type="checkbox" id="isolationDomainAlwaysAllowedInPermanent">
              <label>Allow in Permanent Containers</label>
            </div>
          </div>
        </div>
        <div class="title">
          <h4><i class="dropdown icon"></i>
            Mouse Clicks
          </h4>
        </div>
        <div class="content">
          <div class="field">
            <label>Middle Mouse</label>
            <select id="isolationDomainMouseClickMiddle" class="ui fluid dropdown">
              <option value="global" selected="selected">Use Global</option>
              <option value="always">Always</option>
              <option value="notsamedomainexact">Not exact same Domain</option>
              <option value="notsamedomain">Not same Domain</option>
              <option value="never">Never</option>
            </select>
          </div>
          <div class="field">
            <label>Ctrl/Cmd+Left Mouse</label>
            <select id="isolationDomainMouseClickCtrlLeft" class="ui fluid dropdown">
              <option value="global" selected="selected">Use Global</option>
              <option value="always">Always</option>
              <option value="notsamedomainexact">Not exact same Domain</option>
              <option value="notsamedomain">Not same Domain</option>
              <option value="never">Never</option>
            </select>
          </div>
          <div class="field">
            <label>Left Mouse</label>
            <select id="isolationDomainMouseClickLeft" class="ui fluid dropdown">
              <option value="global" selected="selected">Use Global</option>
              <option value="always">Always</option>
              <option value="notsamedomainexact">Not exact same Domain</option>
              <option value="notsamedomain">Not same Domain</option>
              <option value="never">Never</option>
            </select>
          </div>
        </div>
        <div class="title">
          <h4><i class="dropdown icon"></i>
            Navigating
          </h4>
        </div>
        <div class="content">
          <div class="field">
            <select id="isolationDomainNavigation" class="ui fluid dropdown">
              <option value="global" selected="selected">Use Global</option>
              <option value="always">Always</option>
              <option value="notsamedomainexact">Not exact same Domain</option>
              <option value="notsamedomain">Not same Domain</option>
              <option value="never">Never</option>
            </select>
          </div>
        </div>
      </div>
      <br>
      <div class="field">
        <button id="isolationDomainSave" class="ui button primary">Save</button>
      </div>
      <div>
        <div class="ui accordion">
          <div class="title">
            <h3><i class="dropdown icon"></i>
              Domains
            </h3>
          </div>
          <div class="content">
            <div class="ui bulleted list" id="isolationDomains">
            </div>
          </div>
        </div>
      </div>
    </form>
    <div id="message" class="ui positive message hidden"></div>
  </div>
</template>
