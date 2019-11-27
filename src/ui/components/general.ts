import mixins from 'vue-typed-mixins';
import { mixin } from '../mixin';
import {
  CONTAINER_COLORS,
  CONTAINER_ICONS,
  TOOLBAR_ICON_COLORS,
} from '~/shared';
import { App } from '~/ui/root';

export default mixins(mixin).extend({
  props: {
    app: {
      type: Object as () => App,
      required: true,
    },
  },
  data() {
    return {
      preferences: this.app.preferences,
      permissions: this.app.permissions,
      initialized: false,
      show: false,
      containerColors: CONTAINER_COLORS.map(containerColor => ({
        id: containerColor,
        text: this.t(
          `optionsGeneralContainerColor${containerColor.capitalize()}`
        ),
      })),
      containerIcons: CONTAINER_ICONS.map(containerIcon => ({
        id: containerIcon,
        text: this.t(
          `optionsGeneralContainerIcon${containerIcon.capitalize()}`
        ),
      })),
      toolbarIconColors: TOOLBAR_ICON_COLORS.map(toolbarIconColor => ({
        id: toolbarIconColor,
        text: this.t(
          `optionsGeneralToolbarIconColor${toolbarIconColor
            .capitalize()
            .replace('-s', 'S')}`
        ),
      })),
    };
  },
  async mounted() {
    $('#general .ui.dropdown').dropdown();
    $('#general .ui.checkbox').checkbox();

    $('#containerColorRandomExcluded').dropdown({
      placeholder: 'Select colors to exclude from random selection',
      values: this.containerColors.map(color => ({
        name: color.text,
        value: color.id,
        selected: !!this.preferences.container.colorRandomExcluded.includes(
          color.id
        ),
      })),
      maxSelections: this.containerColors.length - 2,
      onAdd: addedColor => {
        if (
          this.preferences.container.colorRandomExcluded.includes(addedColor)
        ) {
          return;
        }
        this.preferences.container.colorRandomExcluded.push(addedColor);
      },
      onRemove: removedColor => {
        this.$delete(
          this.preferences.container.colorRandomExcluded,
          this.preferences.container.colorRandomExcluded.findIndex(
            excludedColor => excludedColor === removedColor
          )
        );
      },
    });

    $('#containerIconRandomExcluded').dropdown({
      placeholder: 'Select icons to exclude from random selection',
      values: this.containerIcons.map(icon => {
        return {
          name: icon.text,
          value: icon.id,
          selected: !!this.preferences.container.iconRandomExcluded.includes(
            icon.id
          ),
        };
      }),
      maxSelections: this.containerIcons.length - 2,
      onAdd: addedIcon => {
        if (this.preferences.container.iconRandomExcluded.includes(addedIcon)) {
          return;
        }
        this.preferences.container.iconRandomExcluded.push(addedIcon);
      },
      onRemove: removedIcon => {
        this.$delete(
          this.preferences.container.iconRandomExcluded,
          this.preferences.container.iconRandomExcluded.findIndex(
            excludedIcon => excludedIcon === removedIcon
          )
        );
      },
    });

    this.show = true;
  },
  methods: {
    resetContainerNumber(): void {
      if (
        !window.confirm(`
        Reset current number ${this.app.storage.tempContainerCounter} to 0?
      `)
      ) {
        return;
      }

      browser.runtime.sendMessage({
        method: 'resetContainerNumber',
      });

      this.app.storage.tempContainerCounter = 0;
    },
  },
});
