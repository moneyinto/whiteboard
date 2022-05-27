<template>
	<WhiteBoard :width="width" :height="height" />
</template>

<script setup lang="ts">
import { ref } from "vue";
import WhiteBoard from "./components/WhiteBoard/index.vue";
const width = ref(window.innerWidth);
const height = ref(window.innerHeight);
</script>

<style lang="scss">
html, body {
	margin: 0;
	overflow: hidden;
}

#app {
	font-family: Avenir, Helvetica, Arial, sans-serif;
	-webkit-font-smoothing: antialiased;
	-moz-osx-font-smoothing: grayscale;
	color: #2c3e50;
}
</style>
