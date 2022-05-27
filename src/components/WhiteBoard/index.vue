<template>
    <canvas
        ref="canvas"
        :width="canvasWidth"
        :height="canvasHeighth"
        :style="{
            width: canvasDomWidth,
            height: canvasDomHeight,
            cursor: 'crosshair'
        }"
    ></canvas>
</template>

<script setup lang="ts">
import { defineProps, computed, ref, nextTick, PropType } from "vue";
import useHandlePointer from "./hooks/useHandlePointer";
import { IElement, ICanvasConfig } from "./types";
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

const canvas = ref<HTMLCanvasElement | null>(null);
const context = ref<CanvasRenderingContext2D | null>(null);

// 画布配置
const canvasConfig = ref<ICanvasConfig>({
    offsetX: 0,
    offsetY: 0,
    scrollX: 0,
    scrollY: 0,
    zoom: 1
});

// 绘制元素集合
const elements = ref<IElement[]>([]);
const { handleDown, handleMove, handleUp } = useHandlePointer(canvas, context, elements, canvasConfig);

nextTick(() => {
    if (canvas.value) {
        context.value = canvas.value.getContext("2d");
        canvas.value.addEventListener("pointerdown", handleDown);
        canvas.value.addEventListener("pointermove", handleMove);
        canvas.value.addEventListener("pointerup", handleUp);
    }
});
</script>