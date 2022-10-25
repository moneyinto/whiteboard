import { Ref } from "vue";
import { ICanvasConfig, IElement, IElementOptions, IPoint } from "../types";
import { ELEMENT_RESIZE, getBoundsCoordsFromPoints, getTargetElement } from "../utils";
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
    const horizontalZoom = (moveX: number, originX: number) => {
        if (!selectedElement.value) return;
        const oldWidth = selectedElement.value.width;
        const newWidth = oldWidth - moveX;
        const scaleX = newWidth / oldWidth;
        const points = selectedElement.value.points;
        const optionElement = getTargetElement(selectedElement.value!.id, elements.value);
        if (optionElement) {
            updateElement(optionElement, {
                width: newWidth,
                points: points.map(point => [point[0] * scaleX, point[1]]),
                x: selectedElement.value.x + originX * (1 - scaleX)
            });
        }
    }

    /**
     * 纵向变动
     * @param moveY 
     * @param originY 
     * @returns 
     */
    const verticalZoom = (moveY: number, originY: number) => {
        if (!selectedElement.value) return;
        const oldHeight = selectedElement.value.height;
        const newHeight = oldHeight - moveY;
        const scaleY = newHeight / oldHeight;
        const points = selectedElement.value.points;
        const optionElement = getTargetElement(selectedElement.value!.id, elements.value);
        if (optionElement) {
            updateElement(optionElement, {
                height: newHeight,
                points: points.map(point => [point[0], point[1] * scaleY]),
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
            case ELEMENT_RESIZE.LEFT:
            case ELEMENT_RESIZE.LEFT_TOP:
            case ELEMENT_RESIZE.LEFT_BOTTOM:
            case ELEMENT_RESIZE.TOP:
            case ELEMENT_RESIZE.BOTTOM:
            case ELEMENT_RESIZE.RIGHT:
            case ELEMENT_RESIZE.RIGHT_TOP:
            case ELEMENT_RESIZE.RIGHT_BOTTOM: {
                if (/LEFT/.test(canvasConfig.elementOption)) {
                    if (moveX > 0 && Math.sign(selectedElement.value.width) === -1) {
                        selectedElement.value.flipX = selectedElement.value.flipX === 1 ? -1 : 1;
                        canvasConfig.elementOption = canvasConfig.elementOption.replace("LEFT", "RIGHT");
                    } else {
                        horizontalZoom(moveX, maxX);
                    }
                }

                if (/RIGHT/.test(canvasConfig.elementOption)) {
                    if (moveX < 0 && Math.sign(selectedElement.value.width) === -1) {
                        selectedElement.value.flipX = selectedElement.value.flipX === 1 ? -1 : 1;
                        canvasConfig.elementOption = canvasConfig.elementOption.replace("RIGHT", "LEFT");
                    } else {
                        horizontalZoom(-moveX, minX);
                    }
                }

                if (/TOP/.test(canvasConfig.elementOption)) {
                    if (moveY > 0 && Math.sign(selectedElement.value.height) === -1) {
                        selectedElement.value.flipY = selectedElement.value.flipY === 1 ? -1 : 1;
                        canvasConfig.elementOption = canvasConfig.elementOption.replace("TOP", "BOTTOM");
                    } else {
                        verticalZoom(moveY, maxY);
                    }
                }

                if (/BOTTOM/.test(canvasConfig.elementOption)) {
                    if (moveY < 0 && Math.sign(selectedElement.value.height) === -1) {
                        selectedElement.value.flipY = selectedElement.value.flipY === 1 ? -1 : 1;
                        canvasConfig.elementOption = canvasConfig.elementOption.replace("BOTTOM", "TOP");
                    } else {
                        verticalZoom(-moveY, minY);
                    }
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
