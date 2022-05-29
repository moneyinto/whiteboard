<template>
    <div class="white-board" ref="whiteboard">
        <canvas
            ref="canvas"
            :width="canvasWidth"
            :height="canvasHeighth"
            :style="{
                width: canvasDomWidth,
                height: canvasDomHeight,
                cursor: { MOUSE: 'grabbing', PEN: 'crosshair' }[
                    canvasConfig.optionType
                ]
            }"
        ></canvas>

        <ToolBar
            v-model:strokeColor="canvasConfig.strokeColor"
            v-model:optionType="canvasConfig.optionType"
            v-model:lineWidth="canvasConfig.lineWidth"
        />
    </div>
</template>

<script setup lang="ts">
import { ref, nextTick, reactive } from "vue";
import ToolBar from "./components/Toolbar.vue";
import useHandlePointer from "./hooks/useHandlePointer";
import useRenderElement from "./hooks/useRenderElement";
import { IElement, ICanvasConfig } from "./types";
import { OPTION_TYPE } from "./config";
import { throttle } from "lodash";
const canvasScale = window.devicePixelRatio;

const whiteboard = ref<HTMLDivElement | null>(null);
const canvas = ref<HTMLCanvasElement | null>(null);
const context = ref<CanvasRenderingContext2D | null>(null);
const canvasWidth = ref(0 * canvasScale);
const canvasHeighth = ref(0 * canvasScale);
const canvasDomWidth = ref(0 + "px");
const canvasDomHeight = ref(0 + "px");

// 画布配置
const canvasConfig = reactive<ICanvasConfig>({
    offsetX: 0,
    offsetY: 0,
    scrollX: 0,
    scrollY: 0,
    zoom: 1,
    optionType: OPTION_TYPE.MOUSE,
    lineWidth: 5,
    strokeColor: "#000000"
});

// 是否支持触摸
const canTouch = "ontouchstart" in (window as any);

// 绘制元素集合
const elements = ref<IElement[]>([]);
const { handleDown, handleMove, handleUp } = useHandlePointer(
    canvas,
    context,
    elements,
    canvasConfig
);
const { renderElements } = useRenderElement(canvas, context, canvasConfig);

nextTick(() => {
    if (!canvas.value || !whiteboard.value) return;
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

    // 区域大小变化重置canvas
    const resize = throttle(() => {
        if (!whiteboard.value || !context.value) return;
        canvasWidth.value = whiteboard.value.clientWidth * canvasScale;
        canvasHeighth.value = whiteboard.value.clientHeight * canvasScale;
        canvasDomWidth.value = whiteboard.value.clientWidth + "px";
        canvasDomHeight.value = whiteboard.value.clientHeight + "px";

        context.value.scale(canvasScale, canvasScale);
        context.value.setTransform(1, 0, 0, 1, 0, 0);
        context.value.save();
        elements.value = JSON.parse(
            localStorage.getItem("STORE_ELEMENTS") || "[]"
        );
        console.log(elements.value);
        nextTick(() => {
            renderElements(elements.value);
        });
    }, 100);
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(whiteboard.value);
});
</script>

<style>
.white-board {
    width: 100%;
    height: 100%;
    overflow: hidden;
    position: relative;
    color: #333;
    font-family: system-ui, BlinkMacSystemFont, -apple-system, Segoe UI, Roboto,
        Helvetica, Arial, sans-serif;
    user-select: none;
}

@keyframes zoomIn {
    0% {
        opacity: 0;
        -webkit-transform: scale3d(0.3, 0.3, 0.3);
        transform: scale3d(0.3, 0.3, 0.3);
    }

    50% {
        opacity: 1;
    }
}

@keyframes zoomOut {
    0% {
        opacity: 1;
    }

    50% {
        opacity: 0;
        -webkit-transform: scale3d(0.3, 0.3, 0.3);
        transform: scale3d(0.3, 0.3, 0.3);
    }

    to {
        opacity: 0;
    }
}
</style>
