import DomainPattern from '../domainpattern.vue';
import { App } from '~/ui/root';
import { Script, PreferencesSchema } from '~/types';
import mixins from 'vue-typed-mixins';
import { mixin } from '~/ui/mixin';

interface Data {
  preferences: PreferencesSchema;
  domainPattern: string;
  domainPatternDisabled: boolean;
  script: Script;
  editing: boolean;
  editingIndex: number;
}

const scriptDefauls = {
  code: '',
  runAt: 'document_idle',
};

export default mixins(mixin).extend({
  components: {
    DomainPattern,
  },

  props: {
    app: {
      type: Object as () => App,
      required: true,
    },
  },

  data(): Data {
    return {
      preferences: this.app.preferences,
      domainPattern: '',
      domainPatternDisabled: false,
      script: this.clone(scriptDefauls),
      editing: false,
      editingIndex: -1,
    };
  },

  mounted() {
    $('#scriptForm').form({
      fields: {
        scriptDomainPattern: 'empty',
        scriptCode: 'empty',
      },
      onSuccess: event => {
        event.preventDefault();
        if (!this.editing) {
          this.addScript();
        } else {
          this.saveScript();
        }
      },
    });
    $('#scriptForm .ui.dropdown').dropdown();
    $('#scriptForm .ui.checkbox').checkbox();
  },

  methods: {
    addScript(): void {
      const domain = this.preferences.scripts.domain;
      if (!domain[this.domainPattern]) {
        this.$set(domain, this.domainPattern, []);
      }
      domain[this.domainPattern].unshift({ ...this.script });
      this.resetForm();
    },

    saveScript(): void {
      if (!this.editing) {
        return;
      }

      this.$set(
        this.preferences.scripts.domain[this.domainPattern],
        this.editingIndex,
        {
          ...this.script,
        }
      );

      this.resetForm();
    },

    editScript(scriptDomainPattern: string, index: number): void {
      if (!this.preferences.scripts.domain[scriptDomainPattern][index]) {
        return;
      }
      this.domainPatternDisabled = true;
      this.editing = true;
      this.editingIndex = index;
      this.domainPattern = scriptDomainPattern;
      this.script = this.preferences.scripts.domain[scriptDomainPattern][index];

      this.resetDropdowns();
    },

    removeScript(scriptDomainPattern: string, index: number): void {
      if (!window.confirm('Remove script?')) {
        return;
      }
      this.preferences.scripts.domain[scriptDomainPattern].splice(index, 1);
      if (!this.preferences.scripts.domain[scriptDomainPattern].length) {
        this.$delete(this.preferences.scripts.domain, scriptDomainPattern);
      }
    },

    resetForm(): void {
      this.editing = false;
      this.domainPattern = '';
      this.domainPatternDisabled = false;
      this.script = this.clone(scriptDefauls);
      this.resetDropdowns();
    },

    resetDropdowns(): void {
      $('#scriptForm .ui.dropdown').dropdown('destroy');
      this.$nextTick(() => {
        $('#scriptForm .ui.dropdown').dropdown();
      });
    },
  },
});
