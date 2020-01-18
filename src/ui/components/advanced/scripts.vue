<script>
export { default } from './scripts.ts';
</script>

<template>
  <div>
    <form id="scriptForm" class="ui form">
      <h4>
        Configure scripts to execute for certain domains in Temporary Containers
      </h4>
      <div class="ui small negative message">
        <strong>Warning:</strong> Never add scripts from untrusted sources!
        Executing scripts can make you easier fingerprintable. Avoid using
        scripts if you can. Also keep in mind that Firefox Sync storage is
        limited to 100KB, so adding huge scripts here will prevent you from
        exporting preferences to Firefox Sync since the scripts are stored as
        preferences. The local storage limit is 5MB, so adding scripts exceeding
        that might prevent the Add-on from working at all.
      </div>
      <div class="ui small notice message">
        This will call
        <a
          href="https://developer.mozilla.org/en-US/Add-ons/WebExtensions/API/tabs/executeScript"
          target="_blank"
          >tabs.executeScript</a
        >
        if the tab url being loaded belongs to a Temporary Container and its
        domain matches the given pattern. Pro-tip: You can use
        <a
          href="https://developer.mozilla.org/en-US/docs/Mozilla/Tech/Xray_vision#Waiving_Xray_vision"
          target="_blank"
          >window.wrappedJSObject</a
        >
        to access the original window.
      </div>
      <domain-pattern
        id="scriptDomainPattern"
        :glossary="true"
        :domain-pattern.sync="domainPattern"
      />
      <div class="field">
        <label>Script</label>
        <textarea id="scriptCode" v-model="script.code"></textarea>
      </div>
      <div class="field">
        <label>runAt</label>
        <select v-model="script.runAt" class="ui fluid dropdown">
          <option value="document_start">
            document_start
          </option>
          <option value="document_end">
            document_end
          </option>
          <option value="document_idle">
            document_idle
          </option>
        </select>
      </div>
      <div class="field">
        <button class="ui button primary">
          Add
        </button>
      </div>
    </form>
    <div style="margin-top: 30px;">
      <h3>Scripts</h3>
      <div>
        <div v-if="!Object.keys(preferences.scripts.domain).length">
          No Scripts added
        </div>

        <div v-else>
          <div
            v-for="(scripts, scriptDomainPattern) in preferences.scripts.domain"
            :key="scriptDomainPattern"
            class="ui segments"
          >
            <div class="ui segment">
              <h5>{{ scriptDomainPattern }}</h5>
            </div>
            <div class="ui segments">
              <div
                v-for="(domainScript, index) in scripts"
                :key="index"
                class="ui segment"
              >
                <div class="item">
                  Script #{{ index }}
                  <button
                    class="ui right negative small button"
                    style="margin-top: 10px"
                    @click="removeScript(scriptDomainPattern, index)"
                  >
                    <i class="icon-trash-empty" />
                    Remove
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
