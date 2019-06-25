<script>
export default {
  mounted() {
    this.$root.$on('showMessage', message => {
      console.log(message);
    });
  }
};
</script>

<template>
  <div
    id="message"
    class="ui positive message hidden"
  />
</template>

