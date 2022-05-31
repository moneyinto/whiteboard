import { Ref } from "vue";
import { ICanvasConfig, IElement } from "../types";

export default (
    canvas: Ref<HTMLCanvasElement | null>,
    context: Ref<CanvasRenderingContext2D | null>,
    elements: Ref<IElement[]>,
    canvasConfig: ICanvasConfig
) => {
    const clearElements = () => {
        if (!canvas.value || !context.value) return;
        context.value.clearRect(0, 0, canvas.value.width, canvas.value.height);
        elements.value = [];
        canvasConfig.lineWidth = 5;
        canvasConfig.scrollX = 0;
        canvasConfig.scrollY = 0;
        canvasConfig.zoom = 1;
        canvasConfig.strokeColor = "#000000";
    };
    return {
        clearElements
    };
};
