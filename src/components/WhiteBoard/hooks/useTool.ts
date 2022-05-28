import { ICanvasConfig } from "../types";

export default (canvasConfig: ICanvasConfig) => {
    const updateOptionType = (type: string) => {
        canvasConfig.optionType = type;
    };

    const updateLineWidth = (value: number) => {
        canvasConfig.lineWidth = value;
    };

    return {
        updateOptionType,
        updateLineWidth
    };
};
