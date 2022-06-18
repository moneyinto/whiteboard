import { IElement } from "../types";

export default () => {
    const updateElement = (element: IElement, props: Partial<IElement>) => {
        for (const key in props) {
            element[key] = props[key];
        }
    };

    return {
        updateElement
    };
};
