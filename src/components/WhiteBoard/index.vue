<template>
    <div class="white-board">
        <canvas
            ref="canvas"
            :width="canvasWidth"
            :height="canvasHeighth"
            :style="{
                width: canvasDomWidth,
                height: canvasDomHeight
            }"
            @mousedown="handleDown"
            @mousemove="handleMove"
            @mouseup="handleUp"
        ></canvas>
    </div>
</template>

<script setup lang="ts">
import { defineProps, computed, ref, nextTick } from "vue";
import useHandlePointer from "./hooks/useHandlePointer";
const canvasScale = window.devicePixelRatio;
const props = defineProps({
    width: {
        type: Number,
        default: 200
    },
    height: {
        type: Number,
        default: 200
    }
});
const canvasWidth = computed(() => props.width * canvasScale);
const canvasHeighth = computed(() => props.height * canvasScale);
const canvasDomWidth = computed(() => props.width + "px");
const canvasDomHeight = computed(() => props.height +  "px");

const canvas = ref();
const { handleDown, handleMove, handleUp } = useHandlePointer();

nextTick(() => {
    console.log(canvas.value);
});
</script>