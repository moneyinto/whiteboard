<template>
	<WhiteBoard />
</template>

<script setup lang="ts">
import WhiteBoard from "./components/WhiteBoard/index.vue";
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
	width: 100vw;
	height: 100vh;
}
</style>
