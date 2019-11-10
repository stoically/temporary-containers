<script>
export { default } from './index.ts';
</script>

<style>
.glossary {
  min-height: 360px;
  max-height: 360px;
  cursor: auto;
  user-select: text;
}
.glossary-container {
  min-width: 320px;
  max-width: 320px;
}
.glossary-help {
  cursor: help;
}
.glossary-link {
  cursor: pointer;
  color: #2185d0;
}
.glossary-history-btn {
  cursor: pointer;
  opacity: 1 !important;
}
.glossary-history-btn-inactive {
  opacity: 0.2 !important;
}
.glossary-header {
  display: flex;
  font-size: 12px;
  padding: 10px 10px 5px 10px;
}
.glossary-header-title {
  font-weight: bold;
  flex-grow: 1;
}
.glossary-content {
  padding: 10px;
}
ul {
  margin-left: 10px;
  padding-left: 10px;
}
.opaque-info-circle {
  color: #2185d0;
  opacity: 0.6;
}
.opaque-info-circle:hover {
  opacity: 1;
}
</style>

<template>
  <div
    v-if="app.initialized"
    ref="glossary"
    class="ui popup glossary"
    style="padding: 0"
    @click="stop"
  >
    <div ref="glossaryContainer" class="glossary-container">
      <div class="glossary-header">
        <span class="glossary-header-title">{{ active || origin }}</span>
        <span v-if="!['Automatic Mode', 'Toolbar Popup'].includes(origin)">
          <i
            v-if="historyPosition"
            class="angle left icon glossary-history-btn"
            @click="historyBack"
          />
          <i v-else class="angle left icon glossary-history-btn-inactive" />
          <i
            v-if="history.length > 1 && historyPosition < history.length - 1"
            class="angle right icon glossary-history-btn"
            @click="historyForward"
          />
          <i v-else class="angle right icon glossary-history-btn-inactive" />
        </span>
      </div>
      <div class="ui divider" style="margin: 0" />
      <div class="glossary-content">
        <div v-show="active === 'Navigation'">
          Opening <glossary-link to="Target Domain" text="Target Domains" /> in
          tabs, or new tabs, through e.g. address bar or
          <glossary-link to="Mouse Click" />
          <ul>
            <li v-if="section === 'Per Domain'">
              <glossary-link to="Use Global" />
            </li>
            <li><glossary-link to="Never" /></li>
            <li>
              <glossary-link to="Different from Tab Domain & Subdomains" />
            </li>
            <li><glossary-link to="Different from Tab Domain" /></li>
            <li><glossary-link to="Always" /></li>
          </ul>
        </div>

        <div v-show="active === 'Mouse Click'">
          Clicking links on websites in <glossary-link to="Current Tab" /> which
          result in <glossary-link to="Navigation" /> to
          <glossary-link to="Target Domain" /><br />
          <ul>
            <li v-if="section === 'Per Domain'">
              <glossary-link to="Use Global" />
            </li>
            <li><glossary-link to="Never" /></li>
            <li>
              <glossary-link to="Different from Tab Domain & Subdomains" />
            </li>
            <li><glossary-link to="Different from Tab Domain" /></li>
            <li><glossary-link to="Always" /></li>
          </ul>
          <div style="font-size: 12px">
            Note: With Navigation Isolation configured, you don't need to
            configure Mouse Click additionally. Also, not every Mouse Click can
            get catched, since some websites execute arbitrary logic
            (JavaScript) on Mouse Click
          </div>
        </div>

        <div v-show="active === 'Current Tab'">
          Active/Selected tab
        </div>

        <div v-show="active === 'Target Domain'">
          <glossary-link to="Domain" /> which a tab
          <glossary-link to="Navigation" text="navigates" /> to
        </div>
        <div v-show="active === 'Isolation'">
          Cancel <glossary-link to="Navigation" /> and open
          <glossary-link to="Target Domain" /> in new Temporay Container tab
        </div>

        <div v-show="active === 'Global'">
          Configurations apply to all tabs and result in
          <glossary-link to="Isolation" /> if they match
          <ul>
            <li><glossary-link to="Navigation" /></li>
            <li><glossary-link to="Mouse Click" /></li>
            <li><glossary-link to="Exclude Permanent Containers" /></li>
            <li><glossary-link to="Exclude Target Domains" /></li>
          </ul>
          <br />
          <a
            href="#"
            @click="
              external(
                'https://github.com/stoically/temporary-containers/wiki/Global-Isolation'
              )
            "
          >
            Learn more in the Wiki <i class="linkify icon" />
          </a>
        </div>

        <div v-show="active === 'Per Domain'">
          Configurations that apply if the
          <glossary-link to="Target Domain" /> matches the
          <glossary-link to="Domain Pattern" />
          <ul>
            <li><glossary-link to="Always open in" /></li>
          </ul>
          <br />
          Configurations that apply if the
          <glossary-link to="Tab Domain" /> matches the
          <glossary-link to="Domain Pattern" />
          <ul>
            <li><glossary-link to="Navigation" /></li>
            <li><glossary-link to="Mouse Click" /></li>
            <li><glossary-link to="Exclude Target Domains" /></li>
          </ul>
          <br />
          <a
            href="#"
            @click="
              external(
                'https://github.com/stoically/temporary-containers/wiki/Per-Domain-Isolation'
              )
            "
          >
            Learn more in the Wiki <i class="linkify icon" />
          </a>
        </div>

        <div v-show="active === 'Domain'">
          "Web address", e.g. "example.com" or "www.example.com"
        </div>

        <div v-show="active === 'Subdomain'">
          "Deeper levels" of a <glossary-link to="Domain" />, e.g.
          "sub.example.com" or "foo.bar.example.com"
        </div>

        <div v-show="active === 'Tab Domain'">
          <glossary-link to="Domain" /> currently loaded in a tab
        </div>

        <div v-show="active === 'Never'">
          Never matches and hence never results in
          <glossary-link to="Isolation" />
        </div>

        <div v-show="active === 'Different from Tab Domain & Subdomains'">
          <glossary-link to="Target Domain" /> is different from the
          <glossary-link to="Tab Domain" /> and its
          <glossary-link to="Subdomain" text="Subdomains" />
        </div>

        <div v-show="active === 'Different from Tab Domain'">
          <glossary-link to="Target Domain" /> is different from the
          <glossary-link to="Tab Domain" />
        </div>

        <div v-show="active === 'Always'">
          Matches every <glossary-link to="Navigation" /><br />
          <br />
          <div style="font-size: 12px">
            Note: Not every on-website navigation is an actual navigation that
            can be detected by the Add-on. This happens if websites load content
            dynamically (with JavaScript), which is done often nowadays.
          </div>
        </div>

        <div v-show="['Domain Pattern', 'Exclusion Pattern'].includes(active)">
          Can be one of <glossary-link to="Domain" />,
          <glossary-link to="Subdomain" />,
          <glossary-link to="Glob/Wildcard" /> or (advanced)
          <glossary-link to="RegExp" />
        </div>

        <div v-show="active === 'Permanent Containers'">
          All containers that are neither Temporary nor the
          <glossary-link to="Default Container" />
        </div>

        <div v-show="active === 'Default Container'">
          "No Container"
        </div>

        <div v-show="active === 'Use Global'">
          Use the Global configuration accordingly
        </div>

        <div v-show="active === 'Exclude Permanent Containers'">
          <glossary-link to="Navigation" text="Navigations" /> in
          <glossary-link to="Permanent Containers" /> added here will
          <glossary-link to="Never" /> result in
          <glossary-link to="Isolation" />
        </div>

        <div v-show="active === 'Exclude Target Domains'">
          <glossary-link to="Navigation" text="Navigations" /> to
          <glossary-link to="Target Domain" text="Target Domains" /> matching
          the
          <glossary-link to="Exclusion Pattern" text="Exclusion Patterns" />
          added here will <glossary-link to="Never" /> result in
          <glossary-link to="Isolation" />
        </div>

        <div v-show="active === 'Glob/Wildcard'">
          e.g. <strong>*.example.com</strong> - means all example.com subdomains
          <br /><br />
          <strong>*.example.com</strong> would not match
          <strong>example.com</strong>, so you might need two
          <glossary-link to="Domain Pattern" text="Domain Patterns" />.
        </div>

        <div v-show="active === 'RegExp'">
          Parsed as RegExp when<br />
          <strong>/pattern/flags</strong><br />
          is given and matches the full URL instead of just
          <glossary-link to="Domain" />.
        </div>

        <div v-show="active === 'Always open in'">
          <strong>Enabled:</strong>
          <glossary-link to="Navigation" text="Navigations" /> where any of the
          following matches will get
          <glossary-link to="Isolation" text="isolated" />
          <ul>
            <li>Originates from a new tab</li>
            <li>
              <glossary-link to="Target Domain" /> is different from the
              <glossary-link to="Tab Domain" />
            </li>
            <li>
              Current container is <glossary-link to="Default Container" />
            </li>
          </ul>
          <br />
          <strong>Disabled:</strong> No effect
        </div>

        <div v-show="active === 'Multi-Account Containers'">
          This applies to the
          <a
            href="#"
            @click="
              external(
                'https://addons.mozilla.org/firefox/addon/multi-account-containers/'
              )
            "
          >
            MAC Add-on <i class="linkify icon" /> </a
          >, which needs to be installed and configured for this to work. It's
          not related to Per Domain Always open in.
          <br />
          <br />
          <strong>Enabled:</strong>
          <glossary-link to="Navigation" text="Navigations" /> in
          <glossary-link to="Permanent Containers" /> whose
          <glossary-link to="Target Domain" /> isn't MAC-"Always open in"
          assigned to that container get
          <glossary-link to="Isolation" text="isolated" />
          <br />
          <br />
          <strong>Disabled:</strong> No effect
          <br />
          <br />
          <a
            href="#"
            @click="
              external(
                'https://github.com/stoically/temporary-containers/wiki/Multi-Account-Containers-Isolation'
              )
            "
          >
            Learn more in the Wiki <i class="linkify icon" />
          </a>
        </div>

        <div v-show="active === 'Toolbar Popup'">
          The popup lets you
          <ul>
            <li>Open new Temporary Container</li>
            <li>Open Preferences/Options</li>
            <li>Configure Isolation</li>
            <li>Disable/Enable Isolation globally</li>
            <li>Open current tab URL in new Temporary Container</li>
            <li>Convert Temporary to Permanent Container</li>
            <li>Convert Permanent to Temporary Container</li>
            <li>View Statistics</li>
            <li v-show="app.permissions.history">
              Open current tab URL in new "Deletes History Temporary Container"
            </li>
            <li v-show="app.permissions.history">
              Open new "Deletes History Temporary Container
            </li>
          </ul>
          <span style="font-size:13px">
            Note: You can change the default popup tab in the Advanced
            preferences
          </span>
        </div>

        <div v-show="active === 'Automatic Mode'">
          Automatically reopen tabs in new Temporary Containers when
          <ul>
            <li>Opening a new tab</li>
            <li>Tab tries to load a website in no container</li>
            <li>External program opens a link in the browser</li>
          </ul>
          <br />
          <a
            href="#"
            @click="
              external(
                'https://github.com/stoically/temporary-containers/wiki/Automatic-Mode'
              )
            "
          >
            Learn more in the Wiki <i class="linkify icon" />
          </a>
        </div>
      </div>
    </div>
  </div>
</template>
