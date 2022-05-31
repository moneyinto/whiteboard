import { Ref } from "vue";
import { ICanvasConfig, IElement, IPenElement } from "../types";
import { getElementBoundsCoords, getPenSvgPath } from "../utils";

export default (canvas: Ref<HTMLCanvasElement | null>, context: Ref<CanvasRenderingContext2D | null>, canvasConfig: ICanvasConfig) => {
    // 绘制笔记
    const renderPenElement = (element: IPenElement) => {
        // 点少于两个时不进行绘制
        if (element.points.length < 2 || !context.value) return;

        const [x1, y1, x2, y2] = getElementBoundsCoords(element);

        // cx, cy 最小矩形中心点在canvas中的位置
        const cx = ((x1 + x2) / 2 + canvasConfig.scrollX);
        const cy = ((y1 + y2) / 2 + canvasConfig.scrollY);

        // 笔记起始点相对于最小矩形中心点偏移位置
        const shiftX = ((x2 - x1) / 2 - (element.x - x1));
        const shiftY = ((y2 - y1) / 2 - (element.y - y1));

        // 存储状态
        context.value.save();

        // 缩放
        context.value.scale(
            window.devicePixelRatio * canvasConfig.zoom,
            window.devicePixelRatio * canvasConfig.zoom,
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
        context.value.clearRect(0, 0, canvas.value.width, canvas.value.height);
        // 绘制canvas
        elements.forEach(element => {
            switch(element.type) {
                case "pen":
                    renderPenElement(element);
                    break;
            }
        });
    };

    return {
        renderElements,
        renderPenElement
    };
};
