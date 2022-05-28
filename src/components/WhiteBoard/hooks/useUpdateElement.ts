import { Ref } from "vue";
import { IElement } from "../types";

export default (elements: Ref<IElement[]>) => {
    const updateElement = (element: IElement, props: Partial<IElement>) => {
        for (const key in props) {
            (element as any)[key] = (props as any)[key];
        }

        localStorage.setItem("STORE_ELEMENTS", JSON.stringify(elements.value));
    };

    return {
        updateElement
    };
};
