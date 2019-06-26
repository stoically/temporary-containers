<script>
export default {
  props: {
    id: {
      type: String,
      required: true
    }
  },
  data() {
    return {
      domainPattern: ''
    };
  },
  watch: {
    domainPattern(newDomainPattern) {
      this.$emit('update:domainPattern', newDomainPattern);
    }
  },
  mounted() {
    $('#domainPatternDiv').popup({
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
      position: 'bottom left'
    });
  }
};
</script>

<template>
  <div
    id="domainPatternDiv"
    class="field"
  >
    <label>Domain Pattern</label>
    <input
      :id="id"
      v-model="domainPattern"
      type="text"
    >
  </div>
</template>

