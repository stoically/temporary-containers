<script>
import GlossaryLink from './link';

const glossaryDefaults = () => ({
  origin: '',
  active: '',
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
    return glossaryDefaults();
  },
  watch: {
    app(newApp, oldApp) {
      if (!newApp.initialized) {
        return;
      }

      window.setTimeout(() => {
        this.initialize();
      }, 100);
      this.$nextTick(() => {

      });

      this.$root.$on('show', target => {
        this.show(target);
      });
    }
  },
  methods: {
    initialize() {
      $('[data-glossary]').each((idx, element) => {
        const infoText = document.createElement('span');
        infoText.textContent = element.dataset.glossary;
        infoText.id = 'glossaryText';
        element.appendChild(infoText);

        const infoIcon = document.createElement('i');
        infoIcon.className = 'icon-info-circled opaque-info-circle glossary-help';
        element.appendChild(infoIcon);

        let iconHovered = false;
        $(infoIcon).hover(() => {
          iconHovered = true;
          $(element).popup('show');
        }, () => {
          iconHovered = false;
        });
        $(infoIcon).click(() => {
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
              'it might not fit into the popup, please check options page' :
              'please reload page and it should work';
            $(element).popup({
              html: `Error: Unable to show correct tooltip, ${text}. Sorry about that.`,
            });
            $(element).popup('show');
          }
        });
      });
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
    stop(event) {
      event.stopPropagation();
      event.preventDefault();
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
  opacity: 0.3;
}
.opaque-info-circle:hover {
  opacity: 0.6;
}
</style>


<template>
  <div
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
          Opening websites in tabs resulting in navigation to the
          <glossary-link to="Target Domain" />, through e.g.
          <ul>
            <li><glossary-link to="Mouse Click" /></li>
            <li>Address bar</li>
            <li>Tab opened in the background using e.g. middle mouse click</li>
          </ul>
        </div>

        <div v-show="active === 'Mouse Click'">
          Clicking links on websites in <glossary-link to="Current Tab" /> resulting in
          <glossary-link to="Navigation" /> to <glossary-link to="Target Domain" />
        </div>

        <div v-show="active === 'Current Tab'">
          Active/Selected tab
        </div>

        <div v-show="active === 'Target Domain'">
          <glossary-link to="Domain" /> which a tab <glossary-link
            to="Navigation"
            text="navigates"
          /> to
        </div>
        <div v-show="active === 'Isolation'">
          Cancel <glossary-link to="Navigation" /> and open <glossary-link to="Target Domain" /> in new Temporay Container tab
        </div>

        <div v-show="active === 'Configurations'">
          Configured Options / Preferences
        </div>

        <div v-show="active === 'Global'">
          <glossary-link to="Configurations" /> apply to all tabs
        </div>

        <div v-show="active === 'Per Domain'">
          <glossary-link to="Configurations" /> apply if the <glossary-link to="Tab Domain" /> or <glossary-link to="Loading Domain" /> match the <glossary-link to="Domain Pattern" />
        </div>

        <div v-show="active === 'Domain'">
          "Web address", e.g. "example.com"
        </div>

        <div v-show="active === 'Subdomain'">
          "Deeper levels" of a <glossary-link to="Domain" />, e.g. "sub.example.com" or "foo.bar.example.com"
        </div>

        <div v-show="active === 'Tab Domain'">
          <glossary-link to="Domain" /> currently loaded in a tab
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
          Matches every <glossary-link to="Navigation" />
        </div>

        <div v-show="active === 'Domain Pattern'">
          Can be one of <glossary-link to="Domain" />, <glossary-link to="Subdomain" />, <glossary-link to="Glob/Wildcard" />
          or (advanced) <glossary-link to="RegExp" />
        </div>

        <div v-show="active === 'Originating Domain'">
          <glossary-link to="Domain" /> from which a <glossary-link to="Navigation" /> originated
        </div>

        <div v-show="active === 'Different from Loading Domain'">
          <glossary-link to="Originating Domain" /> does not match the <glossary-link to="Tab Domain" />
        </div>

        <div v-show="active === 'Permanent Containers'">
          All containers that are neither Temporary nor the <glossary-link to="Default Container" />
        </div>

        <div v-show="active === 'Default Container'">
          "No Container"
        </div>

        <div v-show="active === 'Use Global'">
          Use the <glossary-link to="Global" /> configuration accordingly
        </div>

        <div v-show="active === 'Isolated Domain'">
          One <glossary-link to="Per Domain" /> <glossary-link
            to="Configurations"
            text="Configuration"
          />
        </div>

        <div v-show="active === 'Exclude'">
          Matching <glossary-link to="Configurations" /> will <glossary-link to="Never" /> result in <glossary-link to="Isolation" />
        </div>

        <div v-show="active === 'Exclusion Pattern'">
          Same as <glossary-link to="Domain Pattern" />
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