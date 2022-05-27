import { Ref, watch } from "vue";
import { ICanvasConfig, IElement } from "../types";
import { getPointPosition, throttleRAF } from "../utils";
import useCreateElement from "./useCreateElement";
import useRenderElement from "./useRenderElement";
import useUpdateElement from "./useUpdateElement";

export default (
    canvas: Ref<HTMLCanvasElement>,
    context: Ref<CanvasRenderingContext2D>,
    elements: Ref<IElement[]>,
    canvasConfig: Ref<ICanvasConfig>
) => {
    const { createPenElement } = useCreateElement(elements);
    const { updateElement } = useUpdateElement(elements);
    const { renderElements } = useRenderElement(canvas, context, canvasConfig);
    let targetElement: IElement | null = null;

    const handleDown = (event: PointerEvent | TouchEvent) => {
        const { x, y } = getPointPosition(event, canvasConfig.value);
        targetElement = createPenElement({ x, y });
    };

    const handleMove = throttleRAF((event: PointerEvent | TouchEvent) => {
        if (!targetElement) return;
        const { x, y } = getPointPosition(event, canvasConfig.value);
        switch(targetElement.type) {
            case "pen": {
                const points = targetElement.points;
                updateElement(targetElement, {
                    points: [...points, [x - targetElement.x, y - targetElement.y]]
                });
                // renderPenElement(targetElement);
                break;
            }
        }
        renderElements(elements.value);
    });

    const handleUp = () => {
        targetElement = null;
    };

    return {
        handleDown,
        handleMove,
        handleUp
    };
};
