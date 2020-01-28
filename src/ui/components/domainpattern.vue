<script>
export { default } from './domainpattern.ts';
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
