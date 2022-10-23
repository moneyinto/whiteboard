import { Ref } from "vue";
import { OPTION_TYPE } from "../config";
import { ICanvasConfig, IElement } from "../types";
import { createRandomCode } from "../utils";

export default (elements: Ref<IElement[]>, canvasConfig: ICanvasConfig) => {
    const createElement = (element: IElement) => {
        elements.value.push(element);
        return element;
    };

    const createPenElement = ({ x, y }: { x: number; y: number }) => {
        return createElement({
            id: createRandomCode(),
            type: OPTION_TYPE.PEN,
            width: 0,
            height: 0,
            x,
            y,
            points: [[0, 0]],
            angle: 0,
            flipX: 1,
            flipY: 1,
            isDelete: false,
            locked: false,
            lineWidth: canvasConfig.lineWidth,
            strokeColor: canvasConfig.strokeColor
        });
    };

    return {
        createPenElement
    };
};
