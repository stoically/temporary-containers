import Vue from 'vue';

import GlossaryLink from './link.vue';

const glossaryDefaults = () => ({
  origin: '',
  active: '',
  section: '',
  history: [],
  historyPosition: 0,
});

export default Vue.extend({
  components: {
    GlossaryLink,
  },
  props: {
    app: {
      type: Object,
      required: true,
    },
  },
  data() {
    return {
      createdElements: [],
      ...glossaryDefaults(),
    };
  },
  watch: {
    app(newApp) {
      if (!newApp.initialized) {
        this.cleanup();
        return;
      }

      this.$nextTick(() => {
        window.setTimeout(() => {
          this.initialize();
        }, 100);
      });
    },
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
          infoText.textContent =
            element.dataset.glossaryLabel || element.dataset.glossary;
          if (infoText.textContent) {
            infoText.id = 'glossaryText';
            element.appendChild(infoText);
          }
          this.createdElements.push(infoText);
        }

        const infoIcon = document.createElement('i');
        infoIcon.className =
          'icon-info-circled opaque-info-circle glossary-help';
        element.appendChild(infoIcon);
        this.createdElements.push(infoIcon);

        let iconHovered = false;
        $(infoIcon).hover(
          () => {
            iconHovered = true;
            $(element).popup('show');
          },
          () => {
            iconHovered = false;
          }
        );
        $(infoIcon).click(event => {
          event.stopPropagation();
          event.preventDefault();

          $(element).popup('show');
        });

        $(element).popup({
          popup: '.glossary.ui.popup',
          hoverable: true,
          position: 'bottom left',

          onShow: popupElement => {
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

          onVisible: () => {
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
          },
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
        url,
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
    },
  },
});
