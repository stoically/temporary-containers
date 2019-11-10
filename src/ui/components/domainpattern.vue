<script>
export { default } from './domainpattern.ts';
</script>

<template>
  <div :id="`${id}Div`" ref="div" class="field">
    <label>
      <span v-if="!exclusion">
        <span v-if="!glossary">Domain Pattern</span>
        <span v-else data-glossary="Domain Pattern" />
      </span>
      <span v-else>
        Exclusion Pattern
      </span>
    </label>
    <input :id="id" v-model="domainPattern" :disabled="disabled" type="text" />
  </div>
</template>
