<script>
export { default } from './settings.ts';
</script>

<template>
  <div class="field">
    <label>
      <span
        v-if="glossary"
        :data-glossary="glossary"
        :data-glossary-label="glossaryLabel"
        :data-glossary-section="perdomain ? 'Per Domain' : 'Global'"
      />
      <span v-else>
        {{ label }}
      </span>
    </label>
    <select v-model="action" class="ui fluid dropdown">
      <option v-if="perdomain" value="global">
        Use Global
      </option>
      <option value="never">
        Never
      </option>
      <option value="notsamedomain">
        Different from Tab Domain & Subdomains
      </option>
      <option value="notsamedomainexact">
        Different from Tab Domain
      </option>
      <option value="always">
        Always
      </option>
    </select>
  </div>
</template>
