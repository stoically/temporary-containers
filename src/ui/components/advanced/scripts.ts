import Vue from 'vue';

import DomainPattern from '../domainpattern.vue';
import { App } from '~/ui/root';
import { Script, PreferencesSchema } from '~/types';

interface Data {
  preferences: PreferencesSchema;
  domainPattern: string;
  script: Script;
}

export default Vue.extend({
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
      script: {
        code: '',
        runAt: 'document_idle',
      },
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
        this.addScript();
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
    },
    removeScript(scriptDomainPattern: string, index: number): void {
      this.preferences.scripts.domain[scriptDomainPattern].splice(index, 1);
      if (!this.preferences.scripts.domain[scriptDomainPattern].length) {
        this.$delete(this.preferences.scripts.domain, scriptDomainPattern);
      }
    },
  },
});
