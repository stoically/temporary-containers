<script>
export default {
  mounted() {
    $(this.$refs.accordion).accordion();



    // create a new instance of `MutationObserver` named `observer`,
    // passing it a callback function
    var observer = new MutationObserver(mutations => {
      if (mutations[0].attributeName === 'class') {
        console.log(mutations[0]);
        this.$root.$emit('min-width',
          this.$refs.glossary.classList.contains('active') ? 600 : false
        );
      }
    });

    // call `observe` on that MutationObserver instance,
    // passing it the element to observe, and the options object
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
            <strong>Domain:</strong> "web address", e.g. "example.com"
          </li>
          <li>
            <strong>Subdomain:</strong> e.g. "sub.example.com" or "foo.bar.example.com"
          </li>
          <li>
            <strong>Domain Pattern:</strong> domain or subdomain
            <a
              href="https://github.com/stoically/temporary-containers/wiki/Domain-Pattern"
              target="_blank"
            >
              <i class="icon-info-circled" />
            </a>
          </li>
          <li>
            <strong>Current Tab:</strong> active/selected tab in Firefox
          </li>
          <li>
            <strong>Mouse Clicks:</strong> clicking links on websites loaded in the current tab
          </li>
          <li>
            <strong>Navigation:</strong> "web browsing" in tabs, including mouse clicks or using the address bar
          </li>
          <li>
            <strong>Target Domain:</strong> the domain which the current tab navigates to
          </li>
          <li>
            <strong>Permanent Containers:</strong> all containers that are neither temporary nor the default container
          </li>
          <div class="ui divider" />
          <li>
            <strong>Global:</strong> configurations apply to all tabs
            <a
              href="https://github.com/stoically/temporary-containers/wiki/Global-Isolation"
              target="_blank"
            >
              <i class="icon-info-circled" />
            </a>
          </li>
          <li>
            <strong>Per Domain:</strong> configurations apply if the current tab domain matches the domain pattern
            <a
              href="https://github.com/stoically/temporary-containers/wiki/Per-Domain-Isolation"
              target="_blank"
            >
              <i class="icon-info-circled" />
            </a>
          </li>
          <div class="ui divider" />
          <li>
            <strong>Never:</strong> ignores all navigations
          </li>
          <li>
            <strong>Not Same Domain:</strong> current tab domain, including subdomains, does not match target domain
          </li>
          <li>
            <strong>Not Exact Same Domain:</strong> current tab domain does not exactly match target domain
          </li>
          <li>
            <strong>Always:</strong> matches all navigations
          </li>
          <li>
            <strong>Use Global:</strong> use the global configuration accordingly
          </li>
          <div class="ui divider" />
          <li>
            <strong>Isolation:</strong> cancel navigation and open target domain in new Temporay Container tab
          </li>
          <li>
            <strong>Exclude:</strong> matching configurations are excluded from isolation
          </li>
          <li>
            <strong>Exclusion Pattern:</strong> same as domain pattern
          </li>
          <div class="ui divider" />
        </ul>
        <br>
        <div style="padding: 0 0 5px 8px">
          <strong>Navigations / Mouse Clicks matching the given configurations result in Isolation</strong>
        </div>
      </div>
    </div>
  </div>
</template>