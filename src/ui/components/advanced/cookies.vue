<script lang="ts">
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
      onSuccess: (event) => {
        event.preventDefault();
        if (!this.editing) {
          this.addCookie();
        } else {
          this.saveCookie();
        }
      },
    });

    this.$nextTick(() => {
      $('#cookieForm .ui.accordion').accordion();
      $('#cookieForm .ui.dropdown').dropdown();
      $('#cookieForm .ui.checkbox').checkbox();
    });
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
      $('#cookieAccordion').accordion('close', 0);
    },

    resetDropdowns(): void {
      $('#cookieForm .ui.dropdown').dropdown('destroy');
      this.$nextTick(() => {
        $('#cookieForm .ui.dropdown').dropdown();
      });
    },
  },
});
</script>

<template>
  <div>
    <form id="cookieForm" class="ui form">
      <h4>
        Configure cookies to be set on certain domains in Temporary Containers
      </h4>
      <div class="ui small negative message">
        <strong>Warning:</strong> Setting cookies can make you easier
        fingerprintable. Especially when they contain user/session-specific
        data. Avoid setting cookies if you can.
      </div>
      <div class="ui small notice message">
        This will call
        <a
          href="https://developer.mozilla.org/en-US/Add-ons/WebExtensions/API/cookies/set"
          target="_blank"
          >cookies.set</a
        >
        and add the cookie to the header (if allowed) during
        <a
          href="https://developer.mozilla.org/en-US/Add-ons/WebExtensions/API/webRequest/onBeforeSendHeaders"
          target="_blank"
          >webRequest.onBeforeSendHeaders</a
        >
        if the request belongs to a Temporary Container and the domain matches
        the given pattern. Make sure that the cookie name and value are
        correctly encoded, or you might break the header being sent.
      </div>
      <domain-pattern
        id="cookieDomainPattern"
        :disabled="domainPatternDisabled"
        :glossary="true"
        :domain-pattern.sync="domainPattern"
      />
      <div class="field">
        <label>name</label>
        <input id="setCookiesDomainName" v-model="cookie.name" type="text" />
      </div>
      <div class="field">
        <label>value</label>
        <input v-model="cookie.value" type="text" />
      </div>
      <div class="field">
        <label>domain</label>
        <input v-model="cookie.domain" type="text" />
      </div>
      <div class="field">
        <label>url</label>
        <input id="cookieUrl" v-model="cookie.url" type="text" />
      </div>
      <div
        id="cookieAccordion"
        style="margin-top: 15px; margin-bottom: 15px;"
        class="ui accordion"
      >
        <div class="title">
          <h4>
            <i class="dropdown icon" />
            Advanced
          </h4>
        </div>
        <div class="content">
          <div class="field">
            <label>expirationDate</label>
            <input v-model="cookie.expirationDate" type="text" />
          </div>
          <div class="field">
            <label>firstPartyDomain</label>
            <input v-model="cookie.firstPartyDomain" type="text" />
          </div>
          <div class="field">
            <label>httpOnly</label>
            <select v-model="cookie.httpOnly" class="ui fluid dropdown">
              <option value="">
                httpOnly
              </option>
              <option value="false">
                false
              </option>
              <option value="true">
                true
              </option>
            </select>
          </div>
          <div class="field">
            <label>path</label>
            <input v-model="cookie.path" type="text" />
          </div>
          <div class="field">
            <label>sameSite</label>
            <select v-model="cookie.sameSite" class="ui fluid dropdown">
              <option value="">
                sameSite
              </option>
              <option value="no_restriction">
                no_restriction
              </option>
              <option value="lax">
                lax
              </option>
              <option value="strict">
                strict
              </option>
            </select>
          </div>
          <div class="field">
            <label>secure</label>
            <select v-model="cookie.secure" class="ui fluid dropdown">
              <option value="">
                secure
              </option>
              <option value="false">
                false
              </option>
              <option value="true">
                true
              </option>
            </select>
          </div>
        </div>
      </div>
      <div class="field">
        <button class="ui button primary">
          {{ !editing ? 'Add' : 'Save' }}
        </button>
      </div>
    </form>
    <div style="margin-top: 30px;" :class="{ hidden: editing }">
      <h3>Cookies</h3>
      <div>
        <div v-if="!Object.keys(preferences.cookies.domain).length">
          No Cookies added
        </div>
        <div v-else>
          <div
            v-for="(cookies, cookiesDomainPattern) in preferences.cookies
              .domain"
            :key="cookiesDomainPattern"
            class="ui segments"
          >
            <div class="ui segment">
              <h5>{{ cookiesDomainPattern }}</h5>
            </div>
            <div class="ui segments">
              <div
                v-for="(domainCookie, index) in cookies"
                :key="index"
                class="ui segment"
                @mouseenter="cookieMouseEnter"
                @mouseleave="cookieMouseLeave"
              >
                <div v-if="domainCookie" class="ui divided list">
                  <div
                    v-for="cookieKey in cookieKeys(domainCookie)"
                    :key="cookieKey"
                    style="padding-bottom: 5px;"
                    class="item"
                  >
                    <div class="ui horizontal label" style="margin-top: 5px;">
                      {{ cookieKey }}
                    </div>
                    <div v-if="cookieKey == 'value'" style="margin-top: 8px;" />
                    {{ domainCookie[cookieKey] }}
                  </div>
                  <div class="item">
                    <button
                      class="ui right primary small button"
                      style="margin-top: 10px;"
                      @click="editCookie(cookiesDomainPattern, index)"
                    >
                      <i class="icon-pencil" />
                      Edit
                    </button>
                    <button
                      class="ui right negative small button"
                      style="margin-top: 10px;"
                      @click="removeCookie(cookiesDomainPattern, index)"
                    >
                      <i class="icon-trash-empty" />
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
