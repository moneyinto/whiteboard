<template>
	<WhiteBoard :width="1920" :height="1080" />
</template>

<script setup lang="ts">
import WhiteBoard from "./components/WhiteBoard/index.vue";
</script>

<style lang="scss">
html, body {
	margin: 0;
}

#app {
	font-family: Avenir, Helvetica, Arial, sans-serif;
	-webkit-font-smoothing: antialiased;
	-moz-osx-font-smoothing: grayscale;
	color: #2c3e50;
}
</style>
