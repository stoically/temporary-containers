<script>
export { default } from './breadcrumb.ts';
</script>

<template>
  <div>
    <div
      class="ui breadcrumb"
      style="font-size: 13px"
      :data-glossary="tab"
      data-glossary-label=""
    >
      <div class="section">
        Isolation
      </div>
      <i class="right angle icon divider" />
      <div class="active section">
        {{ tab }}
      </div>
    </div>
    <div class="ui divider" style="margin: 5px 0 10px 0" />
  </div>
</template>
