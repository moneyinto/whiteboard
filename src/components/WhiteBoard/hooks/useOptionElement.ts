import { Ref } from "vue";
import { ICanvasConfig, IElement, IPoint } from "../types";
import { ELEMENT_RESIZE, getBoundsCoordsFromPoints } from "../utils";
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
        updateElement(selectedElement.value, {
            width: newWidth,
            points: points.map(point => [point[0] * scaleX, point[1]]),
            x: selectedElement.value.x + originX * (1 - scaleX)
        });
    }

    const optionElement = (startPoint: IPoint | null, x: number, y: number) => {
        if (!selectedElement.value || !startPoint) return;
        const moveX = x - startPoint[0];
        const moveY = y - startPoint[1];
        const [minX, minY, maxX, maxY] = getBoundsCoordsFromPoints(selectedElement.value.points);
        switch (canvasConfig.elementOption) {
            case ELEMENT_RESIZE.MOVE: {
                updateElement(selectedElement.value, {
                    x: selectedElement.value.x + moveX,
                    y: selectedElement.value.y + moveY,
                });
                break;
            }
            case ELEMENT_RESIZE.LEFT: {                
                if (moveX > 0 && Math.sign(selectedElement.value.width) === -1) {
                    selectedElement.value.flipX = selectedElement.value.flipX === 1 ? -1 : 1;
                    canvasConfig.elementOption = ELEMENT_RESIZE.RIGHT;
                } else {
                    horizontalZoom(moveX, maxX);
                }
                break;
            }
            case ELEMENT_RESIZE.RIGHT: {
               if (moveX < 0 && Math.sign(selectedElement.value.width) === -1) {
                    selectedElement.value.flipX = selectedElement.value.flipX === 1 ? -1 : 1;
                    canvasConfig.elementOption = ELEMENT_RESIZE.LEFT;
                } else {
                    horizontalZoom(-moveX, minX);
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
