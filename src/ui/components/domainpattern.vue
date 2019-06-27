<script>
export default {
  props: {
    id: {
      type: String,
      required: true
    },
    position: {
      type: String,
      default: 'bottom left'
    },
    domainPattern: {
      type: String,
      default: ''
    },
    disabled: {
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
    $(`#${this.id}Div`).popup({
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
      position: this.position
    });
  }
};
</script>

<template>
  <div
    :id="`${id}Div`"
    class="field"
  >
    <label>Domain Pattern</label>
    <input
      :id="id"
      v-model="domainPattern"
      :disabled="disabled"
      type="text"
    >
  </div>
</template>

