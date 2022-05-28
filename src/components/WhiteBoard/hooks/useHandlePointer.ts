import { Ref, watch } from "vue";
import { OPTION_TYPE } from "../config";
import { ICanvasConfig, IElement, IPoint } from "../types";
import { getCanvasPointPosition, getWhiteBoardPointPosition, throttleRAF } from "../utils";
import useCreateElement from "./useCreateElement";
import useRenderElement from "./useRenderElement";
import useUpdateElement from "./useUpdateElement";

export default (
    canvas: Ref<HTMLCanvasElement | null>,
    context: Ref<CanvasRenderingContext2D | null>,
    elements: Ref<IElement[]>,
    canvasConfig: ICanvasConfig
) => {
    const { createPenElement } = useCreateElement(elements);
    const { updateElement } = useUpdateElement(elements);
    const { renderElements } = useRenderElement(canvas, context, canvasConfig);
    let targetElement: IElement | null = null;
    let startPoint: IPoint | null = null;

    const handleDown = (event: PointerEvent | TouchEvent) => {
        switch(canvasConfig.optionType) {
            case OPTION_TYPE.MOUSE: {
                const { x, y } = getWhiteBoardPointPosition(event, canvasConfig);
                startPoint = [x, y];
                break;
            }
            case OPTION_TYPE.PEN: {
                const { x, y } = getCanvasPointPosition(event, canvasConfig);
                targetElement = createPenElement({ x, y });
                break;
            }
        }
    };

    const handleMove = throttleRAF((event: PointerEvent | TouchEvent) => {
        switch(canvasConfig.optionType) {
            case OPTION_TYPE.MOUSE: {
                if (startPoint) {
                    const { x, y } = getWhiteBoardPointPosition(event, canvasConfig);
                    canvasConfig.scrollX += (x - startPoint[0]);
                    canvasConfig.scrollY += (y - startPoint[1]);
                    startPoint = [x, y];
                    renderElements(elements.value);
                }
                break;
            }
            case OPTION_TYPE.PEN: {
                const { x, y } = getCanvasPointPosition(event, canvasConfig);
                drawOnCanvas(x, y);
                break;
            }
        }
    });

    const drawOnCanvas = (x: number, y: number) => {
        if (!targetElement) return;
        switch(targetElement!.type) {
            case "pen": {
                const points = targetElement!.points;
                updateElement(targetElement!, {
                    points: [...points, [x - targetElement!.x, y - targetElement!.y]]
                });
                // renderPenElement(targetElement);
                break;
            }
        }
        renderElements(elements.value);
    };

    const handleUp = () => {
        targetElement = null;
        startPoint = null;
    };

    return {
        handleDown,
        handleMove,
        handleUp
    };
};
