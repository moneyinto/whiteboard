import { Ref } from "vue";
import { ICanvasConfig, IElement, IElementOptions, IPoint } from "../types";
import { deepClone, ELEMENT_RESIZE, getBoundsCoordsFromPoints, getElementCenterOnCanvas, getTargetElement, normalizeAngle, rotate } from "../utils";
import useRenderElement from "./useRenderElement";
import useUpdateElement from "./useUpdateElement";

export default (
    canvas: Ref<HTMLCanvasElement | null>,
    context: Ref<CanvasRenderingContext2D | null>,
    elements: Ref<IElement[]>,
    canvasConfig: ICanvasConfig,
    selectedElement: Ref<IElement | undefined>
) => {
    const { updateElement } = useUpdateElement();
    const { renderElements } = useRenderElement(
        canvas,
        context,
        canvasConfig,
        selectedElement
    );

    /**
     * 以元素坐标系为中心
     * 缩放都是以坐标系为中心变化
     * 以x坐标变化为例 左边拖拽缩放
     * 缩放比例为 scale
     * 拖拽左边时，左边框正式变化了坐标轴左边的部分
     * 为了保持元素右边位置不变，需要将元素进行左右平移，平移距离为坐标轴右边变化大小
    */

    /**
     * 横向变动
     * @param moveX 
     * @param originX 
     * @returns 
     */
    const horizontalZoom = (moveX: number, originX: number, points: IPoint[]) => {
        if (!selectedElement.value) return;
        const oldWidth = selectedElement.value.width;
        const newWidth = oldWidth - moveX;
        const scaleX = newWidth / oldWidth;
        const optionElement = getTargetElement(selectedElement.value!.id, elements.value);
        const { centerX, centerY } = getElementCenterOnCanvas(selectedElement.value);
        const { x, y } = selectedElement.value;
        const angle = selectedElement.value.angle;
        const [tx, ty] = rotate(x, y, centerX, centerY, angle);
        const originOffset = originX * (scaleX - 1);
        const centerOffset = (newWidth - oldWidth) / 2
        const tx1 = tx - originOffset * Math.cos(angle);
        const ty1 = ty - originOffset * Math.sin(angle);
        const cx = centerX - centerOffset * Math.cos(angle);
        const cy = centerY - centerOffset * Math.sin(angle);
        const [otx, oty] = rotate(tx1, ty1, cx, cy, -angle);
        if (optionElement) {
            points.forEach(point => point[0] = point[0] * scaleX);
            updateElement(optionElement, {
                width: newWidth,
                points,
                x: otx,
                y: oty
            });
        }
    }

    /**
     * 纵向变动
     * @param moveY 
     * @param originY 
     * @returns 
     */
    const verticalZoom = (moveY: number, originY: number, points: IPoint[]) => {
        if (!selectedElement.value) return;
        const oldHeight = selectedElement.value.height;
        const newHeight = oldHeight - moveY;
        const scaleY = newHeight / oldHeight;
        const optionElement = getTargetElement(selectedElement.value!.id, elements.value);
        if (optionElement) {
            points.forEach(point => point[1] = point[1] * scaleY);
            updateElement(optionElement, {
                height: newHeight,
                points,
                y: selectedElement.value.y + originY * (1 - scaleY)
            });
        }
    }

    const optionElement = (startPoint: IPoint | null, x: number, y: number) => {
        if (!selectedElement.value || !startPoint) return;
        const moveX = x - startPoint[0];
        const moveY = y - startPoint[1];
        const [minX, minY, maxX, maxY] = getBoundsCoordsFromPoints(selectedElement.value.points);
        const optionElement = getTargetElement(selectedElement.value!.id, elements.value);
        switch ((ELEMENT_RESIZE as IElementOptions)[canvasConfig.elementOption]) {
            case ELEMENT_RESIZE.MOVE: {
                if (optionElement) {
                    updateElement(optionElement, {
                        x: selectedElement.value.x + moveX,
                        y: selectedElement.value.y + moveY,
                    });
                }
                break;
            }
            case ELEMENT_RESIZE.ANGLE: {
                if (optionElement) {
                    const { centerX, centerY } = getElementCenterOnCanvas(selectedElement.value);
                    const startAngle = Math.atan2(startPoint[1] - centerY, startPoint[0] - centerX);
                    const changeAngle = Math.atan2(y - centerY, x - centerX) - startAngle;
                    const angle = normalizeAngle(selectedElement.value.angle + changeAngle);
                    updateElement(optionElement, {
                        angle
                    });
                }
                break;
            }
            case ELEMENT_RESIZE.LEFT:
            case ELEMENT_RESIZE.LEFT_TOP:
            case ELEMENT_RESIZE.LEFT_BOTTOM:
            case ELEMENT_RESIZE.TOP:
            case ELEMENT_RESIZE.BOTTOM:
            case ELEMENT_RESIZE.RIGHT:
            case ELEMENT_RESIZE.RIGHT_TOP:
            case ELEMENT_RESIZE.RIGHT_BOTTOM: {
                const points = deepClone(selectedElement.value.points);
                if (/LEFT/.test(canvasConfig.elementOption)) {
                    horizontalZoom(moveX * Math.sign(selectedElement.value.width), maxX, points);
                }

                if (/RIGHT/.test(canvasConfig.elementOption)) {
                    horizontalZoom(- moveX * Math.sign(selectedElement.value.width), minX, points);
                }

                if (/TOP/.test(canvasConfig.elementOption)) {
                    verticalZoom(moveY * Math.sign(selectedElement.value.height), maxY, points);
                }

                if (/BOTTOM/.test(canvasConfig.elementOption)) {
                    verticalZoom(- moveY * Math.sign(selectedElement.value.height), minY, points);
                }
                break;
            }
        }
        renderElements(elements.value);
    };

    return {
        optionElement
    }
};
