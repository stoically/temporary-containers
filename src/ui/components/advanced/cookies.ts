import Vue from 'vue';

import DomainPattern from '../domainpattern.vue';
import { App } from '~/ui/root';
import { PreferencesSchema, Cookie } from '~/types';

interface Data {
  preferences: PreferencesSchema;
  domainPattern: string;
  cookie: Cookie;
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
      cookie: {
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
      },
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
        this.addCookie();
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
    },
    removeCookie(cookiesDomainPattern: string, index: number): void {
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
  },
});
