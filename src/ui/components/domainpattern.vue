<script>
export default {
  props: {
    id: {
      type: String,
      required: true
    },
    tooltip: {
      type: Object,
      default: () => ({
        hidden: false,
        position: 'bottom left'
      })
    },
    domainPattern: {
      type: String,
      default: ''
    },
    disabled: {
      type: Boolean,
      default: false
    },
    exclusion: {
      type: Boolean,
      default: false
    }
  },
  watch: {
    domainPattern(newDomainPattern) {
      this.$emit('update:domainPattern', newDomainPattern);
    }
  },
  mounted() {
    if (!this.tooltip.hidden) {
      $(this.$refs.div).popup({
        html: `
          <div style="width:750px;">
          Exact match: e.g. <strong>example.com</strong> or <strong>www.example.com</strong><br>
          Glob/Wildcard match: e.g. <strong>*.example.com</strong> (all example.com subdomains)<br>
          <br>
          Note: <strong>*.example.com</strong> would not match <strong>example.com</strong>,
          so you might need two patterns.</div>
          <br>
          Advanced: Parsed as RegExp when <strong>/pattern/flags</strong> is given
          and matches the full URL instead of just domain
        `,
        inline: true,
        position: this.tooltip.position
      });
    }
  }
};
</script>

<template>
  <div
    :id="`${id}Div`"
    ref="div"
    class="field"
  >
    <label>
      {{ !exclusion ?
        'Domain Pattern' :
        'Exclusion Pattern'
      }}
    </label>
    <input
      :id="id"
      v-model="domainPattern"
      :disabled="disabled"
      type="text"
    >
  </div>
</template>

