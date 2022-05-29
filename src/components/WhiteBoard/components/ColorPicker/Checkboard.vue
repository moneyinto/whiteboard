<template>
    <div class="checkerboard" :style="bgStyle"></div>
</template>

<script setup lang="ts">
import { computed, defineProps, defineEmits } from "vue";

const checkboardCache: { [key: string]: unknown } = {};

const renderCheckboard = (white: string, grey: string, size: number) => {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = size * 2;
    const ctx = canvas.getContext("2d");

    if (!ctx) return null;

    ctx.fillStyle = white;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = grey;
    ctx.fillRect(0, 0, size, size);
    ctx.translate(size, size);
    ctx.fillRect(0, 0, size, size);
    return canvas.toDataURL();
};

const getCheckboard = (white: string, grey: string, size: number) => {
    const key = white + "," + grey + "," + size;
    if (checkboardCache[key]) return checkboardCache[key];

    const checkboard = renderCheckboard(white, grey, size);
    checkboardCache[key] = checkboard;
    return checkboard;
};

const emit = defineEmits(["colorChange"]);

const props = defineProps({
    size: {
        type: Number,
        default: 8
    },
    white: {
        type: String,
        default: "#fff"
    },
    grey: {
        type: String,
        default: "#e6e6e6"
    }
});

const bgStyle = computed(() => {
    const checkboard = getCheckboard(props.white, props.grey, props.size);
    return { backgroundImage: `url(${checkboard})` };
});
</script>

<style scoped>
.checkerboard {
    background-size: contain;
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
}
</style>
