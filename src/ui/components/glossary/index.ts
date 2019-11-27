import Vue from 'vue';

import GlossaryLink from './link.vue';

interface GlossaryDefaults {
  origin: string;
  active: string;
  section: string;
  history: string[];
  historyPosition: number;
}

const glossaryDefaults = (): GlossaryDefaults => ({
  origin: '',
  active: '',
  section: '',
  history: [],
  historyPosition: 0,
});

interface Data extends GlossaryDefaults {
  createdElements: HTMLSpanElement[];
}

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
  data(): Data {
    return {
      createdElements: [],
      ...glossaryDefaults(),
    };
  },
  watch: {
    app(newApp): void {
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
    this.$root.$on('show', (target: string) => {
      this.show(target);
    });
  },
  methods: {
    initialize(): void {
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

            const glossary = ((popupElement as unknown) as HTMLElement).dataset
              .glossary;
            if (!glossary) {
              return;
            }
            this.origin = this.active = glossary;

            const glossaryRef = this.$refs.glossary as HTMLElement;
            const glossaryContainer = this.$refs.glossary as HTMLElement;
            if (['Automatic Mode', 'Toolbar Popup'].includes(this.origin)) {
              glossaryRef.style.minHeight = 'unset';
              glossaryRef.style.maxHeight = 'unset';
              glossaryContainer.style.minWidth = '450px';
              glossaryContainer.style.maxWidth = '450px';
            } else {
              glossaryRef.style.minHeight = '';
              glossaryRef.style.maxHeight = '';
              glossaryContainer.style.minWidth = '';
              glossaryContainer.style.maxWidth = '';
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
    },
    show(target: string): void {
      if (this.history.length - 1 > this.historyPosition) {
        this.history.splice(this.historyPosition + 1);
      }
      this.history.push(target);
      this.historyPosition = this.history.length - 1;

      this.active = target;
    },
    historyBack(): void {
      this.active = this.history[--this.historyPosition];
    },
    historyForward(): void {
      this.active = this.history[++this.historyPosition];
    },
    external(url: string): void {
      browser.tabs.create({
        url,
      });
    },
    stop(event: Event): void {
      event.stopPropagation();
      event.preventDefault();
    },
    cleanup(): void {
      this.createdElements.map(created => {
        created.remove();
      });
    },
  },
});
