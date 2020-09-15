<script lang="ts">
import mixins from 'vue-typed-mixins';
import { mixin } from '~/ui/mixin';

export default mixins(mixin).extend({
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
        <span v-if="!glossary">{{ t('optionsDomainPattern') }}</span>
        <span v-else data-glossary="Domain Pattern" />
      </span>
      <span v-else>
        {{ t('optionsExclusionPattern') }}
      </span>
    </label>
    <input :id="id" v-model="domainPattern" type="text" />
  </div>
</template>
