<script>
export default {
  mounted() {
    $(this.$refs.accordion).accordion();
    var observer = new MutationObserver(mutations => {
      if (mutations[0].attributeName === 'class') {
        this.$root.$emit('min-width',
          this.$refs.glossary.classList.contains('active') ? 650 : false
        );
      }
    });

    observer.observe(this.$refs.glossary, {attributes: true, subtree: true});
  }
};
</script>


<template>
  <div
    v-if="!popup"
    class="ui message"
    :class="{small: !popup, tiny: popup}"
    style="padding: 5px"
  >
    <div
      ref="accordion"
      class="ui accordion"
    >
      <div
        ref="glossary"
        class="title"
      >
        <i
          class="icon-info-circled"
          style="color: #2185d0"
        />
        <strong>Isolation Glossary</strong>
      </div>
      <div class="content">
        <ul
          class="list"
          :style="!popup ? 'margin-left: 7px' : ''"
        >
          <li>
            <strong>Isolation:</strong> cancel <i>Navigations</i> and open <i>Target Domain</i> in new Temporay Container tab
          </li>
          <li>
            <strong>Navigations:</strong> "web browsing" in tabs, including <i>Mouse Clicks</i> or using the address bar
          </li>
          <li>
            <strong>Mouse Clicks:</strong> clicking links on websites in the <i>Current Tab</i>
          </li>
          <li>
            <strong>Target Domain:</strong> the <i>Domain</i> which the <i>Current Tab</i> <i>Navigates</i> to
          </li>
          <li>
            <strong>Domain:</strong> "web address", e.g. "example.com"
          </li>
          <li>
            <strong>Current Tab:</strong> active/selected tab
          </li>
          <li>
            <strong>Current Tab Domain:</strong> the <i>Domain</i> loaded or trying to load in <i>Current Tab</i>
          </li>
          <div class="ui divider" />
          <li>
            <strong>Configurations:</strong> configured options/preferences
          </li>
          <li>
            <strong>Global:</strong> <i>Configurations</i> apply to all tabs
            <a
              href="https://github.com/stoically/temporary-containers/wiki/Global-Isolation"
              target="_blank"
            >
              <i class="icon-info-circled" />
            </a>
          </li>
          <li>
            <strong>Never:</strong> no <i>Isolation</i>
          </li>
          <li>
            <strong>Not Same Domain:</strong> <i>Current Tab Domain</i>, including <i>Subdomains</i>, does not match <i>Target Domain</i>
          </li>
          <li>
            <strong>Subdomain:</strong> e.g. "sub.example.com" or "foo.bar.example.com"
          </li>
          <li>
            <strong>Not Exact Same Domain:</strong> <i>Current Tab Domain</i> does not exactly match <i>Target Domain</i>
          </li>
          <li>
            <strong>Always:</strong> matches all <i>Navigations</i>
          </li>


          <div class="ui divider" />
          <li>
            <strong>Per Domain:</strong> <i>Configurations</i> apply if the <i>Current Tab Domain</i> matches the <i>Domain Pattern</i>
            <a
              href="https://github.com/stoically/temporary-containers/wiki/Per-Domain-Isolation"
              target="_blank"
            >
              <i class="icon-info-circled" />
            </a>
          </li>
          <li>
            <strong>Domain Pattern:</strong> <i>Domain</i> or <i>Subdomain</i>
            <a
              href="https://github.com/stoically/temporary-containers/wiki/Domain-Pattern"
              target="_blank"
            >
              <i class="icon-info-circled" />
            </a>
          </li>

          <li>
            <strong>Navigation Origin:</strong> the <i>Domain</i> from which a <i>Navigation</i> originated
          </li>
          <li>
            <strong>Not Same Origin:</strong> the <i>Navigation Origin</i> does not match the <i>Current Tab Domain</i>
          </li>
          <li>
            <strong>Permanent Containers:</strong> all containers that are neither Temporary nor the <i>Default Container</i>
          </li>
          <li>
            <strong>Default Container:</strong> "No Container"
          </li>
          <li>
            <strong>Use Global:</strong> use the <i>Global</i> configuration accordingly
          </li>
          <li>
            <strong>Isolated Domain:</strong> one <i>Per Domain Configuration</i>
          </li>
          <div class="ui divider" />
          <li>
            <strong>Exclude:</strong> matching <i>Configurations</i> <i>Never</i> result in <i>Isolation</i>
          </li>
          <li>
            <strong>Exclusion Pattern:</strong> same as <i>Domain Pattern</i>
          </li>
        </ul>
        <div style="margin-bottom: 10px" />
      </div>
    </div>
  </div>
</template>