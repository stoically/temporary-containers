<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  props: {
    id: {
      type: String,
      required: true,
    },
    tooltip: {
      type: Object,
      default: (): { hidden: boolean; position: string } => ({
        hidden: false,
        position: 'bottom left',
      }),
    },
    domainPattern: {
      type: String,
      default: '',
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    exclusion: {
      type: Boolean,
      default: false,
    },
    glossary: {
      type: Boolean,
      default: false,
    },
  },
  watch: {
    domainPattern(newDomainPattern): void {
      this.$emit('update:domainPattern', newDomainPattern);
    },
  },
});
</script>

<template>
  <div
    :id="`${id}Div`"
    ref="div"
    class="field input"
    :class="{ disabled: disabled }"
  >
    <label>
      <span v-if="!exclusion">
        <span v-if="!glossary">Domain Pattern</span>
        <span v-else data-glossary="Domain Pattern" />
      </span>
      <span v-else>
        Exclusion Pattern
      </span>
    </label>
    <input :id="id" v-model="domainPattern" type="text" />
  </div>
</template>
