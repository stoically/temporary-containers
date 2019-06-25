<script>
export default {
  props: {
    app: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      preferences: this.app.preferences
    };
  },
  mounted() {

    window.setCookiesDomainAddRule = async () => {
      const domainPattern = document.querySelector('#setCookiesDomainPattern').value;
      const setCookieRule = {
        domain: document.querySelector('#setCookiesDomainDomain').value,
        expirationDate: document.querySelector('#setCookiesDomainExpirationDate').value,
        firstPartyDomain: document.querySelector('#setCookiesFirstPartyDomain').value,
        httpOnly: document.querySelector('#setCookiesDomainHttpOnly').value,
        name: document.querySelector('#setCookiesDomainName').value,
        path: document.querySelector('#setCookiesDomainPath').value,
        sameSite: document.querySelector('#setCookiesSameSite').value,
        secure: document.querySelector('#setCookiesDomainSecure').value,
        url: document.querySelector('#setCookiesDomainUrl').value,
        value: document.querySelector('#setCookiesDomainValue').value
      };

      const domain = this.preferences.cookies.domain;
      if (!domain[domainPattern]) {
        domain[domainPattern] = [];
      }
      domain[domainPattern].push(setCookieRule);
      this.preferences.cookies.domain = {...domain};
      updateSetCookiesDomainRules();
    };

    window.updateSetCookiesDomainRules = () => {
      const setCookiesDomainCookies = $('#setCookiesDomainCookies');
      const domainRules = Object.keys(this.preferences.cookies.domain);
      if (!domainRules.length) {
        setCookiesDomainCookies.html('No Cookies added');
        return;
      }
      setCookiesDomainCookies.html('');
      domainRules.map((domainPattern) => {
        const domainPatternCookies = this.preferences.cookies.domain[domainPattern];
        domainPatternCookies.map((domainPatternCookie, index) => {
          if (!domainPatternCookie) {
            return;
          }
          setCookiesDomainCookies.append(
            `<div class="item" id="${encodeURIComponent(domainPattern)}" idIndex="${index}">${domainPattern} [${index}]: ` +
            ` ${domainPatternCookie.name} ${domainPatternCookie.value} ` +
            '<a href="#" id="setCookiesRemoveDomainPatterns" data-tooltip="Remove Cookie (no confirmation)" ' +
            '><i class="icon-trash-empty"></i></a></div>');
        });
      });

      setCookiesDomainCookies.on('click', async (event) => {
        event.preventDefault();
        const clickTarget = $(event.target).parent().attr('id');
        const domainPattern = $(event.target).parent().parent().attr('id');
        const domainPatternIndex = $(event.target).parent().parent().attr('idIndex');
        if (clickTarget === 'setCookiesRemoveDomainPatterns') {
          delete this.preferences.cookies.domain[decodeURIComponent(domainPattern)][domainPatternIndex];
          const domain = this.preferences.cookies.domain;
          const cookies = domain[decodeURIComponent(domainPattern)].filter(cookie => typeof cookie === 'object');
          if (!cookies.length) {
            delete domain[decodeURIComponent(domainPattern)];
          }
          this.preferences.cookies.domain = {...domain};
          updateSetCookiesDomainRules();
        }
      });
    };

    $('#setCookiesDomainForm').form({
      fields: {
        setCookiesDomainPattern: 'empty',
        setCookiesDomainUrl: 'empty'
      },
      onSuccess: (event) => {
        event.preventDefault();
        setCookiesDomainAddRule();
      }
    });

    $('#setCookiesDomainPatternDiv').popup({
      html: domainPatternToolTip,
      inline: true,
      position: 'bottom left'
    });

    $('#setCookiesDomainForm .ui.dropdown').dropdown();
    $('#setCookiesDomainForm .ui.checkbox').checkbox();

    window.updateSetCookiesDomainRules();
  }
};
</script>


<template>
  <form
    id="setCookiesDomainForm"
    class="ui form"
  >
    <h4>
      Configure cookies to be set on certain domains in Temporary Containers
    </h4>
    <div class="ui negative message">
      <strong>Warning:</strong> Setting cookies can make you easier fingerprintable. Especially
      when they contain user/session-specific data. Avoid setting cookies if you can.
    </div>
    <div class="ui notice message">
      This will call <a
        href="https://developer.mozilla.org/en-US/Add-ons/WebExtensions/API/cookies/set"
        target="_blank"
      >cookies.set</a>
      and add the cookie to the header (if allowed) during <a
        href="https://developer.mozilla.org/en-US/Add-ons/WebExtensions/API/webRequest/onBeforeSendHeaders"
        target="_blank"
      >webRequest.onBeforeSendHeaders</a>.
      If the request belongs to a Temporary Container and the domain matches the given pattern. Make sure that the cookie name and value are correctly
      encoded, or you might break the header being sent.
    </div>
    <div
      id="setCookiesDomainPatternDiv"
      class="field"
    >
      <label>Domain Pattern</label>
      <input
        id="setCookiesDomainPattern"
        type="text"
      >
    </div>
    <div
      id="setCookiesDomainDomainDiv"
      class="field"
    >
      <label>domain</label>
      <input
        id="setCookiesDomainDomain"
        type="text"
      >
    </div>
    <div
      id="setCookiesDomainExpirationDateDiv"
      class="field"
    >
      <label>expirationDate</label>
      <input
        id="setCookiesDomainExpirationDate"
        type="text"
      >
    </div>
    <div
      id="setCookiesFirstPartyDomainDiv"
      class="field"
    >
      <label>firstPartyDomain</label>
      <input
        id="setCookiesFirstPartyDomain"
        type="text"
      >
    </div>
    <div class="field">
      <label>httpOnly</label>
      <select
        id="setCookiesDomainHttpOnly"
        class="ui fluid dropdown"
      >
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
    <div
      id="setCookiesDomainNameDiv"
      class="field"
    >
      <label>name</label>
      <input
        id="setCookiesDomainName"
        type="text"
      >
    </div>
    <div
      id="setCookiesDomainPathDiv"
      class="field"
    >
      <label>path</label>
      <input
        id="setCookiesDomainPath"
        type="text"
      >
    </div>
    <div class="field">
      <label>sameSite</label>
      <select
        id="setCookiesSameSite"
        class="ui fluid dropdown"
      >
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
      <select
        id="setCookiesDomainSecure"
        class="ui fluid dropdown"
      >
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
    <div
      id="setCookiesDomainUrlDiv"
      class="field"
    >
      <label>url</label>
      <input
        id="setCookiesDomainUrl"
        type="text"
      >
    </div>
    <div
      id="setCookiesDomainValueDiv"
      class="field"
    >
      <label>value</label>
      <input
        id="setCookiesDomainValue"
        type="text"
      >
    </div>
    <div class="field">
      <button
        id="setCookiesDomainAddRule"
        class="ui button primary"
      >
        Add
      </button>
    </div>
    <div>
      <h3>Cookies</h3>
      <div
        id="setCookiesDomainCookies"
        class="ui bulleted list"
      />
    </div>
  </form>
</template>
