import { Ref } from "vue";
import { ICanvasConfig, IElement, IPoint } from "../types";
import { ELEMENT_RESIZE } from "../utils";
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

    const optionElement = (startPoint: IPoint | null, x: number, y: number) => {
        if (!selectedElement.value || !startPoint) return;
        const moveX = x - startPoint[0];
        const moveY = y - startPoint[1];
        switch (canvasConfig.elementOption) {
            case ELEMENT_RESIZE.MOVE: {
                updateElement(selectedElement.value, {
                    x: selectedElement.value.x + moveX,
                    y: selectedElement.value.y + moveY,
                });
                break;
            }
            case ELEMENT_RESIZE.LEFT: {
                const oldWidth = selectedElement.value.width;
                const newWidth = oldWidth - moveX;
                const scaleX = newWidth / oldWidth;
                updateElement(selectedElement.value, {
                    width: newWidth,
                    x: selectedElement.value.x + moveX,
                    y: selectedElement.value.y + moveY,
                });
                break;
            }
        }
        renderElements(elements.value);
    };

    return {
        optionElement
    }
};
