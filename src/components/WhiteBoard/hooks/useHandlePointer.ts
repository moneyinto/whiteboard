import { Ref } from "vue";
import { OPTION_TYPE } from "../config";
import { ICanvasConfig, IElement, IPoint } from "../types";
import {
    checkCrossElements,
    getBoundsCoordsFromPoints,
    getCanvasPointPosition,
    getWhiteBoardPointPosition,
    throttleRAF
} from "../utils";
import useCreateElement from "./useCreateElement";
import useRenderElement from "./useRenderElement";
import useUpdateElement from "./useUpdateElement";

export default (
    canvas: Ref<HTMLCanvasElement | null>,
    context: Ref<CanvasRenderingContext2D | null>,
    elements: Ref<IElement[]>,
    canvasConfig: ICanvasConfig
) => {
    const { createPenElement } = useCreateElement(elements, canvasConfig);
    const { updateElement } = useUpdateElement(elements);
    const { renderElements } = useRenderElement(canvas, context, canvasConfig);
    let targetElement: IElement | null = null;
    let startPoint: IPoint | null = null;

    const handleDown = (event: PointerEvent | TouchEvent) => {
        switch (canvasConfig.optionType) {
            case OPTION_TYPE.MOUSE: {
                const { x, y } = getWhiteBoardPointPosition(
                    event,
                    canvasConfig
                );
                startPoint = [x, y];
                break;
            }
            case OPTION_TYPE.PEN: {
                const { x, y } = getCanvasPointPosition(event, canvasConfig);
                targetElement = createPenElement({ x, y });
                break;
            }
            case OPTION_TYPE.ERASER: {
                const { x, y } = getCanvasPointPosition(event, canvasConfig);
                startPoint = [x, y];
                break;
            }
        }
    };

    const handleMove = throttleRAF((event: PointerEvent | TouchEvent) => {
        switch (canvasConfig.optionType) {
            case OPTION_TYPE.MOUSE: {
                if (startPoint) {
                    const { x, y } = getWhiteBoardPointPosition(
                        event,
                        canvasConfig
                    );
                    canvasConfig.scrollX += x - startPoint[0];
                    canvasConfig.scrollY += y - startPoint[1];
                    startPoint = [x, y];
                    renderElements(elements.value);
                }
                break;
            }
            case OPTION_TYPE.PEN: {
                if (!targetElement) return;
                const { x, y } = getCanvasPointPosition(event, canvasConfig);
                drawOnCanvas(x, y);
                break;
            }
            case OPTION_TYPE.ERASER: {
                if (!startPoint) return;
                const { x, y } = getCanvasPointPosition(event, canvasConfig);
                checkCrossElements(
                    startPoint,
                    x,
                    y,
                    elements.value
                );
                renderElements(elements.value);
                startPoint = [x, y];
                break;
            }
        }
    });

    const drawOnCanvas = (x: number, y: number) => {
        if (!targetElement) return;
        switch (targetElement.type) {
            case OPTION_TYPE.PEN: {
                const points = targetElement.points;
                updateElement(targetElement, {
                    points: [
                        ...points,
                        [x - targetElement.x, y - targetElement.y]
                    ]
                });
                // renderPenElement(targetElement);
                break;
            }
        }
        renderElements(elements.value);
    };

    const handleUp = (event: PointerEvent | TouchEvent) => {
        if (targetElement) {
            switch (canvasConfig.optionType) {
                case OPTION_TYPE.PEN: {
                    const points = targetElement.points;
                    if (points.length === 1) {
                        updateElement(targetElement, {
                            points: [...points, [0.0001, 0.0001]]
                        });
                    } else {
                        const { x, y } = getCanvasPointPosition(
                            event,
                            canvasConfig
                        );
                        updateElement(targetElement, {
                            points: [
                                ...points,
                                [x - targetElement.x, y - targetElement.y]
                            ]
                        });
                    }
                    // 更新一下元素width和height 暂时没有考虑旋转角度
                    const [minX, minY, maxX, maxY] = getBoundsCoordsFromPoints(
                        targetElement.points
                    );
                    updateElement(targetElement, {
                        width: maxX - minX,
                        height: maxY - minY
                    });
                    break;
                }
            }
            renderElements(elements.value);
        }
        targetElement = null;
        startPoint = null;
    };

    return {
        handleDown,
        handleMove,
        handleUp
    };
};
