import { ICanvasConfig } from "../types";

/**
 * 生成随机码
 * @param len 随机码长度
 */
export const createRandomCode = (len = 10) => {
    const charset = `_0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz`;
    const maxLen = charset.length;
    let ret = "";
    for (let i = 0; i < len; i++) {
        const randomIndex = Math.floor(Math.random() * maxLen);
        ret += charset[randomIndex];
    }
    return ret;
};

export const getPointPosition = (
    event: MouseEvent,
    canvasConfig: ICanvasConfig
) => {
    return {
        x: (event.clientX - canvasConfig.offsetX) / canvasConfig.zoom + canvasConfig.scrollX,
        y: (event.clientY - canvasConfig.offsetY) / canvasConfig.zoom + canvasConfig.scrollY
    };
};
