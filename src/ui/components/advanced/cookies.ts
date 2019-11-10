import Vue from 'vue';

import DomainPattern from '../domainpattern.vue';

export default Vue.extend({
  components: {
    DomainPattern,
  },
  props: {
    app: {
      type: Object,
      required: true,
    },
  },
  data() {
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
    addCookie() {
      const domain = this.preferences.cookies.domain;
      if (!domain[this.domainPattern]) {
        this.$set(domain, this.domainPattern, []);
      }
      domain[this.domainPattern].unshift({ ...this.cookie });
    },
    removeCookie(cookiesDomainPattern, index) {
      this.preferences.cookies.domain[cookiesDomainPattern].splice(index, 1);
      if (!this.preferences.cookies.domain[cookiesDomainPattern].length) {
        this.$delete(this.preferences.cookies.domain, cookiesDomainPattern);
      }
    },
    cookieKeys(domainCookie) {
      return Object.keys(this.cookie).filter(key => domainCookie[key]);
    },
    cookieMouseEnter(event) {
      event.target.classList.add('red');
    },
    cookieMouseLeave(event) {
      event.target.classList.remove('red');
    },
  },
});
