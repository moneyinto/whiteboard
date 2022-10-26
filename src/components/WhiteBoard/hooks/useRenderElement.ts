import { Ref } from "vue";
import { OPTION_TYPE } from "../config";
import { IBoundsCoords, ICanvasConfig, IElement, IPenElement, IRects } from "../types";
import {
    getElementBoundsCoords,
    getElementResizePoints,
    getPenSvgPath,
    getTargetElement,
    getVisibleElements,
} from "../utils";

export default (
    canvas: Ref<HTMLCanvasElement | null>,
    context: Ref<CanvasRenderingContext2D | null>,
    canvasConfig: ICanvasConfig,
    selectedElement: Ref<IElement | undefined>
) => {
    const drawCheckBoxRect = (coords: IBoundsCoords) => {
        if (!context.value) return;
        context.value.clearRect(...coords);
        context.value.strokeRect(...coords);
    };

    const drawCheckBox = (element: IElement) => {
        if (!context.value) return;
        context.value.save();

        // 缩放
        context.value.scale(
            window.devicePixelRatio * canvasConfig.zoom,
            window.devicePixelRatio * canvasConfig.zoom
        );

        const [minX, minY, maxX, maxY] = getElementBoundsCoords(element);
        const elementWidth = maxX - minX;
        const elementHeight = maxY - minY;
        const dashedLinePadding = 4 / canvasConfig.zoom;
        const dashWidth = 8 / canvasConfig.zoom;
        const spaceWidth = 4 / canvasConfig.zoom;
        const cx = (minX + maxX) / 2 + canvasConfig.scrollX;
        const cy = (minY + maxY) / 2 + canvasConfig.scrollY;

        // 移动坐标系原点
        context.value.translate(cx, cy);

        // 目标旋转对应的角度
        context.value.rotate(element.angle);

        // 平移坐标原点
        // context.value.translate(canvasConfig.scrollX, canvasConfig.scrollY);
        
        context.value.strokeStyle = "#333";
        context.value.lineWidth = 1 / canvasConfig.zoom;
        context.value.setLineDash([dashWidth, spaceWidth]);
        context.value.strokeRect(
            - elementWidth / 2 - dashedLinePadding,
            - elementHeight / 2 - dashedLinePadding,
            elementWidth + dashedLinePadding * 2,
            elementHeight + dashedLinePadding * 2
        );

        // 绘制九点
        // 坐标值计算
        const rects: IRects = getElementResizePoints(- elementWidth / 2, - elementHeight / 2, elementWidth, elementHeight, dashedLinePadding, dashWidth);
        context.value.setLineDash([0, 0]);
        for (const key in rects) {
            drawCheckBoxRect(rects[key]);
        }

        context.value.restore();
    };

    // 绘制笔记
    const renderPenElement = (element: IPenElement) => {
        // 点少于两个时不进行绘制
        if (element.points.length < 2 || !context.value) return;
        const [x1, y1, x2, y2] = getElementBoundsCoords(element);

        // cx, cy 最小矩形中心点在canvas中的位置
        const cx = (x1 + x2) / 2 + canvasConfig.scrollX;
        const cy = (y1 + y2) / 2 + canvasConfig.scrollY;

        // 笔记起始点相对于最小矩形中心点偏移位置
        const shiftX = (x2 - x1) / 2 - (element.x - x1);
        const shiftY = (y2 - y1) / 2 - (element.y - y1);

        // 存储状态
        context.value.save();

        // 缩放
        context.value.scale(
            window.devicePixelRatio * canvasConfig.zoom,
            window.devicePixelRatio * canvasConfig.zoom
        );

        // 移动坐标系原点
        context.value.translate(cx, cy);

        // 目标旋转对应的角度
        context.value.rotate(element.angle);

        // 坐标原点移动到笔记起始位置
        context.value.translate(-shiftX, -shiftY);

        // 绘制笔记
        context.value.fillStyle = element.strokeColor;
        const path = getPenSvgPath(element.points, element.lineWidth);
        context.value.fill(path);

        context.value.stroke();

        // 状态复原
        context.value.restore();
    };

    const renderElements = (elements: IElement[]) => {
        if (!canvas.value || !context.value) return;
        const normalizedCanvasWidth = canvas.value.width / canvasConfig.zoom;
        const normalizedCanvasHeight = canvas.value.height / canvasConfig.zoom;
        context.value.clearRect(0, 0, canvas.value.width, canvas.value.height);
        const visibleElements = getVisibleElements(
            elements,
            canvasConfig.scrollX,
            canvasConfig.scrollY,
            normalizedCanvasWidth,
            normalizedCanvasHeight
        );

        // 绘制canvas
        visibleElements.forEach((element) => {
            if (!element.isDelete) {
                switch (element.type) {
                    case OPTION_TYPE.PEN:
                        renderPenElement(element);
                        break;
                }
            }
        });

        // 绘制选中框
        if (selectedElement.value) {
            const targetElement = getTargetElement(selectedElement.value!.id, elements);
            if (targetElement) {
                drawCheckBox(targetElement);
            }
        }
    };

    return {
        renderElements,
        renderPenElement,
    };
};
