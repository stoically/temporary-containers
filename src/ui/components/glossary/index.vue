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
        this.initialize();
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
        const infoText = document.createElement('span');
        infoText.textContent = element.dataset.glossaryLabel || element.dataset.glossary;
        infoText.id = 'glossaryText';
        element.appendChild(infoText);

        const infoIcon = document.createElement('i');
        infoIcon.className = 'icon-info-circled opaque-info-circle glossary-help';
        element.appendChild(infoIcon);

        this.createdElements.push({infoText, infoIcon});

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

          onShow: (element) => {
            return iconHovered;
          },

          onVisible: (popupElement) => {
            this.origin = this.active = popupElement.dataset.glossary;
            if (element.dataset.glossarySection) {
              this.section = element.dataset.glossarySection;
            }
            this.history.push(this.origin);

            this.$nextTick(() => {
              $(element).popup('reposition');
            });
          },

          onHidden: () => {
            Object.assign(this.$data, glossaryDefaults());
          },

          onUnplaceable: () => {
            const text = this.app.popup ?
              'please reopen the popup or check options page instead' :
              'please reload page and it should work';
            $(element).popup({
              html: `Error: Unable to show correct tooltip,
                something went wrong while calculating its size, ${text}. Sorry about that.
              `,
            });
            $(element).popup('show');
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
        created.infoText.remove();
        created.infoIcon.remove();
      });
    }
  }
};
</script>


<style>
.glossary {
  min-height: 300px;
  cursor: auto;
  user-select: text;
}
.glossary-container {
  min-width: 260px;
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
}
.glossary-header {
  font-size: 12px;
  padding: 10px 10px 5px 10px;
}
.glossary-content {
  padding: 10px;
}
.glossary-footer {
  padding: 10px;
}
ul {
  margin-left: 10px;
  padding-left: 10px;
}
.opaque-info-circle {
  opacity: 0.25;
}
.opaque-info-circle:hover {
  opacity: 0.6;
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
    <div class="glossary-container">
      <div class="glossary-header">
        <strong>{{ active || origin }}</strong>
      </div>
      <div
        class="ui divider"
        style="margin: 0"
      />
      <div class="glossary-content">
        <div v-show="active === 'Navigation'">
          Opening websites in tabs, or new tabs, through e.g.
          <ul>
            <li>Address bar</li>
            <li><glossary-link to="Mouse Click" /></li>
          </ul>
          Navigations happen from the <glossary-link to="Originating Domain" /> to the
          <glossary-link to="Target Domain" />. When finished it's the
          <glossary-link to="Tab Domain" />
        </div>

        <div v-show="active === 'Mouse Click'">
          Clicking links on websites in <glossary-link to="Current Tab" /> resulting in
          <glossary-link to="Navigation" /> to <glossary-link to="Target Domain" /><br>
          <br>
          <div style="font-size: 12px">
            Note: With Navigation configured, you don't need to configure Mouse Click
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
          <br>Available configurations
          <ul>
            <li v-if="section === 'Per Domain'">
              <glossary-link to="Use Global" />
            </li>
            <li><glossary-link to="Never" /></li>
            <li><glossary-link to="Different from Tab Domain & Subdomains" /></li>
            <li><glossary-link to="Different from Tab Domain" /></li>
            <li><glossary-link to="Always" /></li>
          </ul>
        </div>
        <div v-show="active === 'Isolation'">
          Cancel <glossary-link to="Navigation" /> and open <glossary-link to="Target Domain" /> in new Temporay Container tab,
          hence isolating the <glossary-link to="Originating Domain" />
        </div>

        <div v-show="active === 'Global'">
          Configurations apply to all tabs<br>
          <br>
          Matching Configurations, other than <glossary-link to="Never" />, result in <glossary-link to="Isolation" />
          <br><br>
          <a
            href="#"
            @click="external('https://github.com/stoically/temporary-containers/wiki/Global-Isolation')"
          >
            Learn more <i class="linkify icon" />
          </a>
        </div>

        <div v-show="active === 'Per Domain'">
          Configurations apply if the <glossary-link to="Tab Domain" /> matches the <glossary-link to="Domain Pattern" /><br>
          <br>
          <a
            href="#"
            @click="external('https://github.com/stoically/temporary-containers/wiki/Per-Domain-Isolation')"
          >
            Learn more <i class="linkify icon" />
          </a>
        </div>

        <div v-show="active === 'Domain'">
          "Web address", e.g. "example.com"
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

        <div v-show="active === 'Different from Tab Domain & Subdomains'">
          <glossary-link to="Tab Domain" /> & <glossary-link
            to="Subdomain"
            text="Subdomains"
          /> do not match <glossary-link to="Target Domain" />
        </div>

        <div v-show="active === 'Different from Tab Domain'">
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
          <glossary-link to="Navigations" /> in <glossary-link to="Permanent Containers" /> added
          here will <glossary-link to="Never" /> result in <glossary-link to="Isolation" />
        </div>

        <div v-show="active === 'Exclude Target Domains'">
          <glossary-link to="Navigations" /> to <glossary-link
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
          <glossary-link
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
        </div>
      </div>

      <div class="glossary-footer">
        <div style="margin-top: 10px" />
        <div v-show="history.length > 1">
          <div
            class="ui divider"
            style="margin: 0 0 2px 0"
          />
          <div style="margin-bottom: 2px">
            <i
              v-show="historyPosition"
              class="angle left icon glossary-history-btn"
              @click="historyBack"
            />
            <i
              v-show="history.length > 1 && historyPosition < history.length - 1"
              class="angle right icon glossary-history-btn"
              @click="historyForward"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>