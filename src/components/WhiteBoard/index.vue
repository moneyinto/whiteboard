<template>
	<div class="white-board" ref="whiteboard">
		<canvas
			ref="canvas"
			:width="canvasWidth"
			:height="canvasHeighth"
			@mousewheel.prevent="wheelScaleCanvas"
			:style="{
				width: canvasDomWidth,
				height: canvasDomHeight,
				cursor: cursor
			}"
		></canvas>

		<ToolBar
			v-model:strokeColor="canvasConfig.strokeColor"
			v-model:optionType="canvasConfig.optionType"
			v-model:lineWidth="canvasConfig.lineWidth"
			v-model:zoom="canvasConfig.zoom"
			:snapshotCursor="snapshotCursor"
			:snapshotKeys="snapshotKeys"
			@undo="undo"
			@redo="redo"
			@zoomChange="zoomChange"
			@clear="clearElements"
		/>
	</div>
</template>

<script setup lang="ts">
import { ref, nextTick, reactive, onUnmounted, computed } from "vue";
import ToolBar from "./components/Toolbar.vue";
import useHandlePointer from "./hooks/useHandlePointer";
import useRenderElement from "./hooks/useRenderElement";
import useZoom from "./hooks/useZoom";
import useClearElement from "./hooks/useClearElement";
import { IElement, ICanvasConfig } from "./types";
import { OPTION_TYPE } from "./config";
import { throttle } from "lodash";
import db from "./utils/db";
import useHistorySnapshot from "./hooks/useHistorySnapshot";
const canvasScale = window.devicePixelRatio;

const whiteboard = ref<HTMLDivElement | null>(null);
const canvas = ref<HTMLCanvasElement | null>(null);
const context = ref<CanvasRenderingContext2D | null>(null);
const canvasWidth = ref(0 * canvasScale);
const canvasHeighth = ref(0 * canvasScale);
const canvasDomWidth = ref(0 + "px");
const canvasDomHeight = ref(0 + "px");
const snapshotCursor = ref(-1);
const snapshotKeys = ref([]);
const hoverElement = ref<IElement | undefined>();
const selectedElement = ref<IElement | undefined>();

const cursor = computed(() => {
	if (canvasConfig.isMoveOrScale) return "grabbing";
    if (canvasConfig.elementOption) return canvasConfig.elementOption;
	return {
		MOUSE: "default",
		PEN: "crosshair",
		ERASER: "url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAAAXNSR0IArs4c6QAAARRJREFUOE/dlDFLxEAQhd+BVouFZ3vlQuwSyI+5a7PBRkk6k9KzTOwStJFsWv0xgaQzkNLWszim0kL2OOFc9oKRYHFTz37Lm/dmJhi5JiPzcBjAOYDz7WheADz3jalP8oIxds85P3Zd90RBqqpad133SUSXAJ5M4H3AhWVZd1EUzYQQP96VZYkkSV7btr02QY1Axtgqz/NTz/OM6qSUCMNwRURneoMJOLdt+7Gu643MfeU4zrppmgt9pibgjRBiWRRFb0R934eUcgngdrfxX4CjSwZj7C3Lsqnu8Lc05XQQBO9ENP2NKapnE5s4jme608rhNE2HxWb7qwr2A+f8SAv2BxFdDQ32rpLRVu9Pl+0wztcg6V/VPW4Vw1FsawAAAABJRU5ErkJggg==') 10 10, auto"
	}[canvasConfig.optionType]
});

// 画布配置
const canvasConfig = reactive<ICanvasConfig>({
	offsetX: 0,
	offsetY: 0,
	scrollX: 0,
	scrollY: 0,
	zoom: 1,
	optionType: OPTION_TYPE.MOUSE,
	lineWidth: 5,
	strokeColor: "#000000",
	isDrawing: false,
	isMoveOrScale: false,
    elementOption: ""
});

// 是否支持触摸
const canTouch = "ontouchstart" in window;

// 绘制元素集合
const elements = ref<IElement[]>([]);
const { handleDown, handleMove, handleUp, watchKeyDown, watchKeyUp } = useHandlePointer(
	canvas,
	context,
	elements,
	canvasConfig,
	snapshotKeys,
	snapshotCursor,
	hoverElement,
	selectedElement
);
const { renderElements } = useRenderElement(canvas, context, canvasConfig, selectedElement);
const { updateScroll, handleWeel } = useZoom(canvas, canvasConfig);
const { clearElements } = useClearElement(
	canvas,
	context,
	elements,
	canvasConfig
);
const { getHistorySnapshot, undo, redo } = useHistorySnapshot(elements, snapshotKeys, snapshotCursor, renderElements);

// 进行缩放
const zoomChange = (newZoom: number, oldZoom: number) => {
	updateScroll(
		newZoom,
		oldZoom,
		canvas.value!.width / 2,
		canvas.value!.height / 2
	);
	renderElements(elements.value);
};

const wheelScaleCanvas = throttle((event: WheelEvent) => {
	if (event.metaKey || event.ctrlKey) {
		handleWeel(event.pageX, event.pageY, event.deltaY);
		renderElements(elements.value);
	}
}, 30);

nextTick(async () => {
    await db.init(); // 初始化数据库
	if (!canvas.value || !whiteboard.value) return;
	context.value = canvas.value.getContext("2d");

	window.addEventListener("keydown", watchKeyDown);
	window.addEventListener("keyup", watchKeyUp);

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

		nextTick(async () => {
            await getHistorySnapshot();
			renderElements(elements.value);
		});
	}, 100);
	const resizeObserver = new ResizeObserver(resize);
	resizeObserver.observe(whiteboard.value);
});

onUnmounted(() => {
	window.removeEventListener("keydown", watchKeyDown);
	window.removeEventListener("keyup", watchKeyUp);
	if (canTouch) {
		canvas.value?.removeEventListener("touchstart", handleDown);
		canvas.value?.removeEventListener("touchmove", handleMove);
		canvas.value?.removeEventListener("touchend", handleUp);
	} else {
		canvas.value?.removeEventListener("pointerdown", handleDown);
		canvas.value?.removeEventListener("pointermove", handleMove);
		canvas.value?.removeEventListener("pointerup", handleUp);
	}
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

.eraser {
	cursor: url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAAAXNSR0IArs4c6QAAARRJREFUOE/dlDFLxEAQhd+BVouFZ3vlQuwSyI+5a7PBRkk6k9KzTOwStJFsWv0xgaQzkNLWszim0kL2OOFc9oKRYHFTz37Lm/dmJhi5JiPzcBjAOYDz7WheADz3jalP8oIxds85P3Zd90RBqqpad133SUSXAJ5M4H3AhWVZd1EUzYQQP96VZYkkSV7btr02QY1Axtgqz/NTz/OM6qSUCMNwRURneoMJOLdt+7Gu643MfeU4zrppmgt9pibgjRBiWRRFb0R934eUcgngdrfxX4CjSwZj7C3Lsqnu8Lc05XQQBO9ENP2NKapnE5s4jme608rhNE2HxWb7qwr2A+f8SAv2BxFdDQ32rpLRVu9Pl+0wztcg6V/VPW4Vw1FsawAAAABJRU5ErkJggg==")
			10 10,
		auto;
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
