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
            <strong>Isolation:</strong> cancel <i>Navigation</i> and open <i>Target Domain</i> in new Temporay Container tab
          </li>
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
            <strong>Per Domain:</strong> <i>Configurations</i> apply if the <i>Tab Domain</i> or <i>Loading Domain</i> match the <i>Domain Pattern</i>
            <a
              href="https://github.com/stoically/temporary-containers/wiki/Per-Domain-Isolation"
              target="_blank"
            >
              <i class="icon-info-circled" />
            </a>
          </li>
          <div class="ui divider" />
          <li>
            <strong>Navigation:</strong> "web browsing" in tabs, including <i>Mouse Click</i> or using the address bar
          </li>
          <li>
            <strong>Target Domain:</strong> <i>Domain</i> which a tab <i>Navigates</i> to
          </li>
          <li>
            <strong>Mouse Click:</strong> clicking links on websites in <i>Current Tab</i> resulting in <i>Navigation</i> to <i>Target Domain</i>
          </li>
          <li>
            <strong>Domain:</strong> "web address", e.g. "example.com" (in case of new tabs the domain is "about:newtab")
          </li>
          <li>
            <strong>Subdomain:</strong> "deeper levels" of a <i>Domain</i>, e.g. "sub.example.com" or "foo.bar.example.com"
          </li>
          <li>
            <strong>Current Tab:</strong> active/selected tab
          </li>
          <li>
            <strong>Tab Domain:</strong> <i>Domain</i> currently loaded in a tab
          </li>
          <li>
            <strong>Loading Domain:</strong> <i>Domain</i> trying to load in a tab
          </li>
          <div class="ui divider" />
          <li>
            <strong>Never:</strong> no <i>Isolation</i>
          </li>
          <li>
            <strong>Different from Tab Domain & Subdomains:</strong> <i>Tab Domain</i> & <i>Subdomains</i> do not match <i>Target Domain</i>
          </li>
          <li>
            <strong>Different from Tab Domain:</strong> <i>Tab Domain</i> does not exactly match <i>Target Domain</i>
          </li>
          <li>
            <strong>Always:</strong> matches every <i>Navigation</i>
          </li>
          <div class="ui divider" />
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
            <strong>Originating Domain:</strong> <i>Domain</i> from which a <i>Navigation</i> originated
          </li>
          <li>
            <strong>Different from Loading Domain:</strong> <i>Originating Domain</i> does not match the <i>Tab Domain</i>
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
            <strong>Exclude:</strong> matching <i>Configurations</i> will <i>Never</i> result in <i>Isolation</i>
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