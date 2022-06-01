import { Ref } from "vue";
import { IElement } from "../types";

export default (elements: Ref<IElement[]>) => {
    const updateElement = (element: IElement, props: Partial<IElement>) => {
        for (const key in props) {
            (element as any)[key] = (props as any)[key];
        }
    };

    return {
        updateElement
    };
};
