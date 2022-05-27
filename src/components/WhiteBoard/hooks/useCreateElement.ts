import { Ref } from "vue";
import { IElement } from "../types";
import { createRandomCode } from "../utils";

export default (elements: Ref<IElement[]>) => {
    const createElement = (element: IElement) => {
        elements.value.push(element);
        return element;
    };

    const createPenElement = ({ x, y }: { x: number; y: number }) => {
        return createElement({
            id: createRandomCode(),
            type: "pen",
            width: 0,
            height: 0,
            x,
            y,
            points: [[0, 0]],
            angle: 0,
            isDelete: false,
            locked: false
        });
    };

    return {
        createPenElement
    };
};
