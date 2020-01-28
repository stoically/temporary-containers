import DomainPattern from '../domainpattern.vue';
import { App } from '~/ui/root';
import { PreferencesSchema, Cookie } from '~/types';
import mixins from 'vue-typed-mixins';
import { mixin } from '~/ui/mixin';

interface Data {
  preferences: PreferencesSchema;
  domainPattern: string;
  domainPatternDisabled: boolean;
  cookie: Cookie;
  editing: boolean;
  editingIndex: number;
}

const cookieDefaults = {
  domain: '',
  expirationDate: '',
  firstPartyDomain: '',
  httpOnly: '',
  name: '',
  path: '',
  sameSite: '',
  secure: '',
  url: '',
  value: '',
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
      cookie: this.clone(cookieDefaults),
      editing: false,
      editingIndex: -1,
    };
  },

  mounted() {
    $('#cookieForm').form({
      fields: {
        cookieDomainPattern: 'empty',
        cookieUrl: 'empty',
      },
      onSuccess: event => {
        event.preventDefault();
        if (!this.editing) {
          this.addCookie();
        } else {
          this.saveCookie();
        }
      },
    });
    $('#cookieForm .ui.dropdown').dropdown();
    $('#cookieForm .ui.checkbox').checkbox();
  },

  methods: {
    addCookie(): void {
      const domain = this.preferences.cookies.domain;
      if (!domain[this.domainPattern]) {
        this.$set(domain, this.domainPattern, []);
      }
      domain[this.domainPattern].unshift({ ...this.cookie });

      this.resetForm();
    },

    saveCookie(): void {
      if (!this.editing) {
        return;
      }

      this.$set(
        this.preferences.cookies.domain[this.domainPattern],
        this.editingIndex,
        {
          ...this.cookie,
        }
      );

      this.resetForm();
    },

    editCookie(cookieDomainPattern: string, index: number): void {
      if (!this.preferences.cookies.domain[cookieDomainPattern][index]) {
        return;
      }

      this.domainPatternDisabled = true;
      this.editing = true;
      this.editingIndex = index;
      this.domainPattern = cookieDomainPattern;
      this.cookie = this.preferences.cookies.domain[cookieDomainPattern][index];

      this.resetDropdowns();
    },

    removeCookie(cookiesDomainPattern: string, index: number): void {
      if (!window.confirm('Remove cookie?')) {
        return;
      }
      this.preferences.cookies.domain[cookiesDomainPattern].splice(index, 1);
      if (!this.preferences.cookies.domain[cookiesDomainPattern].length) {
        this.$delete(this.preferences.cookies.domain, cookiesDomainPattern);
      }
    },

    cookieKeys(domainCookie: Cookie): string[] {
      return Object.keys(this.cookie).filter(
        (key: string) => domainCookie[key]
      );
    },

    cookieMouseEnter(event: Event): void {
      (event.target as HTMLElement).classList.add('red');
    },

    cookieMouseLeave(event: Event): void {
      (event.target as HTMLElement).classList.remove('red');
    },

    resetForm(): void {
      this.editing = false;
      this.domainPattern = '';
      this.domainPatternDisabled = false;
      this.cookie = this.clone(cookieDefaults);
      this.resetDropdowns();
    },

    resetDropdowns(): void {
      $('#cookieForm .ui.dropdown').dropdown('destroy');
      this.$nextTick(() => {
        $('#cookieForm .ui.dropdown').dropdown();
      });
    },
  },
});
