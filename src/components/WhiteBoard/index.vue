<template>
	<div class="white-board" ref="whiteboard">
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
	</div>
</template>

<script setup lang="ts">
import { defineProps, computed, ref, nextTick } from "vue";
import useHandlePointer from "./hooks/useHandlePointer";
import useRenderElement from "./hooks/useRenderElement";
import { IElement, ICanvasConfig } from "./types";
import { throttle } from "./utils";
const canvasScale = window.devicePixelRatio;

const whiteboard = ref<HTMLDivElement | null>(null);
const canvas = ref<HTMLCanvasElement | null>(null);
const context = ref<CanvasRenderingContext2D | null>(null);
const canvasWidth = ref(0 * canvasScale);
const canvasHeighth = ref(0 * canvasScale);
const canvasDomWidth = ref(0 + "px");
const canvasDomHeight = ref(0 + "px");

// 画布配置
const canvasConfig = ref<ICanvasConfig>({
    offsetX: 0,
    offsetY: 0,
    scrollX: 0,
    scrollY: 0,
    zoom: 1
});

// 是否支持触摸
const canTouch = "ontouchstart" in (window as any);

// 绘制元素集合
const elements = ref<IElement[]>([]);
const { handleDown, handleMove, handleUp } = useHandlePointer(canvas, context, elements, canvasConfig);
const { renderElements } = useRenderElement(canvas, context, canvasConfig);

nextTick(() => {
    context.value = canvas.value.getContext("2d");

    if (canTouch) {
        canvas.value.addEventListener("touchstart", handleDown);
        canvas.value.addEventListener("touchmove", handleMove);
        canvas.value.addEventListener("touchend", handleUp);
    } else {
        canvas.value.addEventListener("pointerdown", handleDown);
        canvas.value.addEventListener("pointermove", handleMove);
        canvas.value.addEventListener("pointerup", handleUp);
    }

    const resize = throttle(() => {
        console.log("==== 区域发生变化");
        canvasWidth.value = whiteboard.value?.clientWidth * canvasScale;
        canvasHeighth.value = whiteboard.value?.clientHeight * canvasScale;
        canvasDomWidth.value = whiteboard.value?.clientWidth + "px";
        canvasDomHeight.value = whiteboard.value?.clientHeight + "px";

        context.value.scale(canvasScale, canvasScale);
        context.value.setTransform(1, 0, 0, 1, 0, 0);
        context.value.save();
        console.log(elements.value);
        nextTick(() => {
            renderElements(elements.value);
        });
    }, 100);
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(whiteboard.value);
});
</script>

<style scoped>
.white-board {
	width: 100%;
	height: 100%;
	overflow: hidden;
}
</style>