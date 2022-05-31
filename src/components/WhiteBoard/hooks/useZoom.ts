import { Ref } from "vue";
import { ICanvasConfig } from "../types";
import { getZoomScroll } from "../utils";

export default (
    canvas: Ref<HTMLCanvasElement | null>,
    canvasConfig: ICanvasConfig
) => {
    const getWhiteBoardCenter = () => {
        return {
            x: canvas.value!.width / 2,
            y: canvas.value!.height / 2
        };
    };

    const updateScroll = (
        newZoom: number,
        oldZoom: number,
        x: number,
        y: number
    ) => {
        const { scrollX, scrollY } = getZoomScroll(x, y, canvasConfig, newZoom, oldZoom);
        canvasConfig.scrollX = scrollX;
        canvasConfig.scrollY = scrollY;
    };

    const handleWeel = (clientX: number, clientY: number, deltaY: number) => {
        const x = clientX - canvasConfig.offsetX;
        const y = clientY - canvasConfig.offsetY;
        const sign = Math.sign(deltaY);
        const MAX_STEP = 10;
        const absDelta = Math.abs(deltaY);
        let delta = deltaY;
        if (absDelta > MAX_STEP) {
            delta = MAX_STEP * sign;
        }

        const newZoom = canvasConfig.zoom - delta / 100;
        const oldZoom = canvasConfig.zoom;
        canvasConfig.zoom = newZoom;
        updateScroll(newZoom, oldZoom, x, y);
    };

    return {
        getWhiteBoardCenter,
        updateScroll,
        handleWeel
    };
};
