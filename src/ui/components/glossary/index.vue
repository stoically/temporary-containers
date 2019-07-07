<script>
import GlossaryLink from './link';

const glossaryDefaults = () => ({
  origin: '',
  active: '',
  section: '',
  history: [],
  historyPosition: 0
});
export default {
  components: {
    GlossaryLink
  },
  props: {
    app: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      createdElements: [],
      ...glossaryDefaults()
    };
  },
  watch: {
    app(newApp, oldApp) {
      if (!newApp.initialized) {
        this.cleanup();
        return;
      }

      this.$nextTick(() => {
        window.setTimeout(() => {
          this.initialize();
        }, 100);
      });
    }
  },
  mounted() {
    this.$root.$on('show', target => {
      this.show(target);
    });
  },
  methods: {
    initialize() {
      $('[data-glossary]').each((idx, element) => {
        if (element.dataset.glossaryLabel !== '' && element.dataset.glossary) {
          const infoText = document.createElement('span');
          infoText.textContent = element.dataset.glossaryLabel || element.dataset.glossary;
          if (infoText.textContent) {
            infoText.id = 'glossaryText';
            element.appendChild(infoText);
          }
          this.createdElements.push(infoText);
        }

        const infoIcon = document.createElement('i');
        infoIcon.className = 'icon-info-circled opaque-info-circle glossary-help';
        element.appendChild(infoIcon);
        this.createdElements.push(infoIcon);

        let iconHovered = false;
        $(infoIcon).hover(() => {
          iconHovered = true;
          $(element).popup('show');
        }, () => {
          iconHovered = false;
        });
        $(infoIcon).click(event => {
          event.stopPropagation();
          event.preventDefault();

          $(element).popup('show');
        });

        $(element).popup({
          popup: '.glossary.ui.popup',
          hoverable: true,
          position: 'bottom left',

          onShow: (popupElement) => {
            if (!iconHovered) {
              return false;
            }
            this.origin = this.active = popupElement.dataset.glossary;

            if (['Automatic Mode', 'Toolbar Popup'].includes(this.origin)) {
              this.$refs.glossary.style.minHeight = 'unset';
              this.$refs.glossary.style.maxHeight = 'unset';
              this.$refs.glossaryContainer.style.minWidth = '450px';
              this.$refs.glossaryContainer.style.maxWidth = '450px';
            } else {
              this.$refs.glossary.style.minHeight = '';
              this.$refs.glossary.style.maxHeight = '';
              this.$refs.glossaryContainer.style.minWidth = '';
              this.$refs.glossaryContainer.style.maxWidth = '';
            }
          },

          onVisible: (popupElement) => {
            if (['Global', 'Per Domain'].includes(this.origin)) {
              this.section = this.origin;
            } else if (element.dataset.glossarySection) {
              this.section = element.dataset.glossarySection;
            }

            this.history.push(this.origin);

            this.$nextTick(() => {
              $(element).popup('reposition');
            });
          },

          onHidden: () => {
            Object.assign(this.$data, glossaryDefaults());
          }
        });
      });
      this.initialized = false;
    },
    show(target) {
      if (this.history.length - 1 > this.historyPosition) {
        this.history.splice(this.historyPosition + 1);

      }
      this.history.push(target);
      this.historyPosition = this.history.length - 1;

      this.active = target;
    },
    historyBack() {
      this.active = this.history[--this.historyPosition];
    },
    historyForward() {
      this.active = this.history[++this.historyPosition];
    },
    external(url) {
      browser.tabs.create({
        url
      });
    },
    stop() {
      event.stopPropagation();
      event.preventDefault();
    },
    cleanup() {
      this.createdElements.map(created => {
        created.remove();
      });
    }
  }
};
</script>


<style>
.glossary {
  min-height: 360px;
  max-height: 360px;
  cursor: auto;
  user-select: text;
}
.glossary-container {
  min-width: 285px;
  max-width: 285px;
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
    <div
      ref="glossaryContainer"
      class="glossary-container"
    >
      <div class="glossary-header">
        <span class="glossary-header-title">{{ active || origin }}</span>
        <span v-if="!['Automatic Mode', 'Toolbar Popup'].includes(origin)">
          <i
            v-if="historyPosition"
            class="angle left icon glossary-history-btn"
            @click="historyBack"
          />
          <i
            v-else
            class="angle left icon glossary-history-btn-inactive"
          />
          <i
            v-if="history.length > 1 && historyPosition < history.length - 1"
            class="angle right icon glossary-history-btn"
            @click="historyForward"
          />
          <i
            v-else
            class="angle right icon glossary-history-btn-inactive"
          />
        </span>
      </div>
      <div
        class="ui divider"
        style="margin: 0"
      />
      <div class="glossary-content">
        <div v-show="active === 'Navigation'">
          Opening websites in tabs, or new tabs, through e.g. address bar or <glossary-link to="Mouse Click" /><br>
          <br>
          Navigations happen from the <glossary-link to="Originating Domain" /> to the
          <glossary-link to="Target Domain" />. When finished it's the
          <glossary-link to="Tab Domain" />
        </div>

        <div v-show="active === 'Mouse Click'">
          Clicking links on websites in <glossary-link to="Current Tab" /> resulting in
          <glossary-link to="Navigation" /> to <glossary-link to="Target Domain" /><br>
          <br>
          Isolation configurations:
          <ul>
            <li v-if="section === 'Per Domain'">
              <glossary-link to="Use Global" />
            </li>
            <li><glossary-link to="Never" /></li>
            <li><glossary-link to="Different Tab Domain & Subdomains" /></li>
            <li><glossary-link to="Different Tab Domain" /></li>
            <li><glossary-link to="Always" /></li>
          </ul>
          <div style="font-size: 12px">
            Note: With Navigation Isolation configured, you don't need to configure Mouse Click
            additionally. Also, not every Mouse Click can get catched, since some
            websites execute arbitrary logic (JavaScript) on Mouse Click
          </div>
        </div>

        <div v-show="active === 'Current Tab'">
          Active/Selected tab
        </div>

        <div v-show="active === 'Target Domain'">
          <glossary-link to="Domain" /> which a tab <glossary-link
            to="Navigation"
            text="navigates"
          /> to<br>
          <br>
          Isolation configurations:
          <ul>
            <li v-if="section === 'Per Domain'">
              <glossary-link to="Use Global" />
            </li>
            <li><glossary-link to="Never" /></li>
            <li><glossary-link to="Different Tab Domain & Subdomains" /></li>
            <li><glossary-link to="Different Tab Domain" /></li>
            <li><glossary-link to="Always" /></li>
          </ul>
        </div>
        <div v-show="active === 'Isolation'">
          Cancel <glossary-link to="Navigation" /> and open <glossary-link to="Target Domain" /> in new Temporay Container tab,
          hence isolating the <glossary-link to="Originating Domain" />
        </div>

        <div v-show="active === 'Global'">
          Configurations apply to all tabs and result in <glossary-link to="Isolation" /> if they match
          <ul>
            <li>
              <glossary-link to="Navigation" />
              <ul>
                <li><glossary-link to="Target Domain" /></li>
              </ul>
            </li>
            <li><glossary-link to="Mouse Click" /></li>
            <li><glossary-link to="Exclude Permanent Containers" /></li>
            <li><glossary-link to="Exclude Target Domains" /></li>
          </ul>
          <br>
          <a
            href="#"
            @click="external('https://github.com/stoically/temporary-containers/wiki/Global-Isolation')"
          >
            Learn more in the Wiki <i class="linkify icon" />
          </a>
        </div>

        <div v-show="active === 'Per Domain'">
          Configurations apply if the <glossary-link to="Tab Domain" /> matches the <glossary-link to="Domain Pattern" />
          <ul>
            <li><glossary-link to="Always open in" /></li>
            <li>
              <glossary-link to="Navigation" />
              <ul>
                <li><glossary-link to="Target Domain" /></li>
              </ul>
            </li>
            <li><glossary-link to="Mouse Click" /></li>
            <li><glossary-link to="Exclude Target Domains" /></li>
          </ul>
          <br>
          <a
            href="#"
            @click="external('https://github.com/stoically/temporary-containers/wiki/Per-Domain-Isolation')"
          >
            Learn more in the Wiki <i class="linkify icon" />
          </a>
        </div>

        <div v-show="active === 'Domain'">
          "Web address", e.g. "example.com" or "www.example.com"
        </div>

        <div v-show="active === 'Subdomain'">
          "Deeper levels" of a <glossary-link to="Domain" />, e.g. "sub.example.com" or "foo.bar.example.com"
        </div>

        <div v-show="active === 'Tab Domain'">
          <glossary-link to="Domain" /> currently loaded in a tab<br>
          <br>
          If a tab has an <glossary-link to="Opener Tab" />, then its currently loaded Domain will be
          the Tab Domain
        </div>

        <div v-show="active === 'Opener Tab'">
          Tab from which a tab got opened. This happens if e.g.
          <ul>
            <li>Using middle <glossary-link to="Mouse Click" /> to open a background tab</li>
            <li>A website opens a new tab if you left mouse click a link</li>
          </ul>
        </div>

        <div v-show="active === 'Loading Domain'">
          <glossary-link to="Domain" /> trying to load in a tab
        </div>

        <div v-show="active === 'Never'">
          Never matches and hence never results in <glossary-link to="Isolation" />
        </div>

        <div v-show="active === 'Different Tab Domain & Subdomains'">
          <glossary-link to="Tab Domain" /> & <glossary-link
            to="Subdomain"
            text="Subdomains"
          /> do not match <glossary-link to="Target Domain" />
        </div>

        <div v-show="active === 'Different Tab Domain'">
          <glossary-link to="Tab Domain" /> does not exactly match <glossary-link to="Target Domain" />
        </div>

        <div v-show="active === 'Always'">
          Matches every <glossary-link to="Navigation" /><br>
          <br>
          <div style="font-size: 12px">
            Note: Not every on-website navigation is an actual navigation that can be
            detected by the Add-on. This happens if websites load content dynamically
            (with JavaScript), which is done often nowadays.
          </div>
        </div>

        <div v-show="['Domain Pattern', 'Exclusion Pattern'].includes(active)">
          Can be one of <glossary-link to="Domain" />, <glossary-link to="Subdomain" />, <glossary-link to="Glob/Wildcard" />
          or (advanced) <glossary-link to="RegExp" />
        </div>

        <div v-show="active === 'Originating Domain'">
          <glossary-link to="Domain" /> from which a <glossary-link to="Navigation" /> originated,
          also known as referer or source
        </div>

        <div v-show="active === 'Permanent Containers'">
          All containers that are neither Temporary nor the <glossary-link to="Default Container" />
        </div>

        <div v-show="active === 'Default Container'">
          "No Container"
        </div>

        <div v-show="active === 'Use Global'">
          Use the Global configuration accordingly
        </div>

        <div v-show="active === 'Exclude Permanent Containers'">
          <glossary-link
            to="Navigation"
            text="Navigations"
          /> in <glossary-link to="Permanent Containers" /> added
          here will <glossary-link to="Never" /> result in <glossary-link to="Isolation" />
        </div>

        <div v-show="active === 'Exclude Target Domains'">
          <glossary-link
            to="Navigation"
            text="Navigations"
          /> to <glossary-link
            to="Target Domain"
            text="Target Domains"
          /> matching the
          <glossary-link
            to="Exclusion Pattern"
            text="Exclusion Patterns"
          /> added
          here will <glossary-link to="Never" /> result in <glossary-link to="Isolation" />
        </div>

        <div v-show="active === 'Glob/Wildcard'">
          e.g. <strong>*.example.com</strong> - means all example.com subdomains
          <br><br>
          <strong>*.example.com</strong> would not match <strong>example.com</strong>,
          so you might need two <glossary-link
            to="Domain Pattern"
            text="Domain Patterns"
          />.
        </div>

        <div v-show="active === 'RegExp'">
          Parsed as RegExp when<br>
          <strong>/pattern/flags</strong><br>
          is given and matches the full URL instead of just <glossary-link to="Domain" />.
        </div>

        <div v-show="active === 'Always open in'">
          <strong>Enabled:</strong> <glossary-link
            to="Navigation"
            text="Navigations"
          /> where any of the following matches will get <glossary-link
            to="Isolation"
            text="isolated"
          />
          <ul>
            <li>Originates from a new tab</li>
            <li>Current container is the <glossary-link to="Default Container" /></li>
            <li>
              <glossary-link to="Originating Domain" /> is different
              from the <glossary-link to="Loading Domain" />
            </li>
          </ul>
          <br>
          <strong>Disabled:</strong> No effect
        </div>

        <div v-show="active === 'Multi-Account Containers'">
          This applies to the
          <a
            href="#"
            @click="external('https://addons.mozilla.org/firefox/addon/multi-account-containers/')"
          >
            MAC Add-on <i class="linkify icon" />
          </a>, which needs to be installed and configured properly for this to work.
          It's not related to Per Domain Always open in.
          <br>
          <br>
          <strong>Enabled:</strong> <glossary-link
            to="Navigation"
            text="Navigations"
          /> in
          <glossary-link to="Permanent Containers" /> whose <glossary-link to="Loading Domain" /> isn't MAC-"Always open in"
          assigned to that container get <glossary-link
            to="Isolation"
            text="isolated"
          />
          <br>
          <br>
          <strong>Disabled:</strong> No effect
          <br>
          <br>
          <a
            href="#"
            @click="external('https://github.com/stoically/temporary-containers/wiki/Multi-Account-Containers-Isolation')"
          >
            Learn more in the Wiki <i class="linkify icon" />
          </a>
        </div>

        <div v-show="active === 'Toolbar Popup'">
          The popup lets you
          <ul>
            <li> Open new Temporary Container</li>
            <li> Open Preferences/Options</li>
            <li> Configure Isolation</li>
            <li> Disable/Enable Isolation globally</li>
            <li> Open current tab URL in new Temporary Container</li>
            <li> Convert Temporary to Permanent Container</li>
            <li> Convert Permanent to Temporary Container</li>
            <li> View Statistics</li>
            <li
              v-show="
                app.permissions.history"
            >
              Open current tab URL in new "Deletes History Temporary Container"
            </li>
            <li v-show="app.permissions.history">
              Open new "Deletes History Temporary Container
            </li>
          </ul>
          <span style="font-size:13px">
            Note: You can change the default popup tab in the Advanced preferences
          </span>
        </div>

        <div v-show="active === 'Automatic Mode'">
          Automatically reopen tabs in new Temporary Containers when
          <ul>
            <li>Opening a new tab</li>
            <li>Tab tries to load a website in no container</li>
            <li>External program opens a link in the browser</li>
          </ul>
          <br>
          <a
            href="#"
            @click="external('https://github.com/stoically/temporary-containers/wiki/Automatic-Mode')"
          >
            Learn more in the Wiki <i class="linkify icon" />
          </a>
        </div>
      </div>
    </div>
  </div>
</template>