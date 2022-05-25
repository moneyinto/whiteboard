import { Ref } from "vue";
import { ICanvasConfig, IElement } from "../types";
import { getPointPosition } from "../utils";
import useCreateElement from "./useCreateElement";
import useRenderElement from "./useRenderElement";

export default (context: Ref<CanvasRenderingContext2D | null>, elements: Ref<IElement[]>, canvasConfig: Ref<ICanvasConfig>) => {
    const { createPenElement } = useCreateElement(elements);
    const { renderElements } = useRenderElement(context.value!);

    const handleDown = (event: MouseEvent) => {
        const { x, y } = getPointPosition(event, canvasConfig.value);
        createPenElement({ x, y });
        console.log(elements.value);
    };

    const handleMove = (event: MouseEvent) => {
        // console.log(event);
    };

    const handleUp = (event: MouseEvent) => {
        // console.log(event);
    };

    return {
        handleDown,
        handleMove,
        handleUp
    }
}