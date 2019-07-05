<script>
export default {
  props: {
    tab: {
      type: String,
      required: true
    }
  }
};
</script>


<template>
  <div>
    <div
      class="ui breadcrumb"
      style="font-size: 13px"
    >
      <div class="section">
        Isolation
      </div>
      <i class="right angle icon divider" />
      <div class="active section">
        <span :data-glossary="tab" />
      </div>
    </div>
    <div
      class="ui divider"
      style="margin: 5px 0 10px 0"
    />
  </div>
</template>
