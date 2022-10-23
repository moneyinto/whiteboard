import { Ref } from "vue";
import { OPTION_TYPE } from "../config";
import { ICanvasConfig, IElement, IPoint } from "../types";
import {
    checkCrossElements,
    getBoundsCoordsFromPoints,
    getCanvasPointPosition,
    getElementOption,
    getPositionElement,
    getVisibleElements,
    getWhiteBoardPointPosition,
    throttleRAF
} from "../utils";
import useCreateElement from "./useCreateElement";
import useHistorySnapshot from "./useHistorySnapshot";
import useOptionElement from "./useOptionElement";
import useRenderElement from "./useRenderElement";
import useUpdateElement from "./useUpdateElement";

export default (
    canvas: Ref<HTMLCanvasElement | null>,
    context: Ref<CanvasRenderingContext2D | null>,
    elements: Ref<IElement[]>,
    canvasConfig: ICanvasConfig,
    snapshotKeys: Ref<number[]>,
    snapshotCursor: Ref<number>,
    hoverElement: Ref<IElement | undefined>,
    selectedElement: Ref<IElement | undefined>
) => {
    const { createPenElement } = useCreateElement(elements, canvasConfig);
    const { updateElement } = useUpdateElement();
    const { renderElements } = useRenderElement(canvas, context, canvasConfig, selectedElement);
    const { optionElement } = useOptionElement(canvas, context, elements, canvasConfig, selectedElement);
    const { addHistorySnapshot } = useHistorySnapshot(elements, snapshotKeys, snapshotCursor);
    let targetElement: IElement | null = null;
    let startPoint: IPoint | null = null;

    // 获取元素操作鼠标展示光标
    const setElementOptiontMouseCursor = (x: number, y: number) => {
        canvasConfig.elementOption = hoverElement.value ? "MOVE" : "";
        if (selectedElement.value) {
            const elementOption = getElementOption([ x, y ], selectedElement.value);
            if (elementOption) canvasConfig.elementOption = elementOption;
        }
    };

    const canvasMove = (event: PointerEvent | TouchEvent) => {
        if (startPoint && canvasConfig.isMoveOrScale) {
            const { x, y } = getWhiteBoardPointPosition(
                event,
                canvasConfig
            );
            canvasConfig.scrollX += x - startPoint[0];
            canvasConfig.scrollY += y - startPoint[1];
            startPoint = [x, y];
            renderElements(elements.value);
        }
    };

    const handleDown = (event: PointerEvent | TouchEvent) => {
        if (canvasConfig.isMoveOrScale) {
            const { x, y } = getWhiteBoardPointPosition(
                event,
                canvasConfig
            );
            startPoint = [x, y];
            return;
        }

        switch (canvasConfig.optionType) {
            case OPTION_TYPE.MOUSE: {
                // 选定鼠标点击的元素
                const { x, y } = getCanvasPointPosition(event, canvasConfig);
                startPoint = [x, y];
                
                // 选中执行元素操作
                if (selectedElement.value) {
                    canvasConfig.elementOption = hoverElement.value ? "MOVE" : "";
                    const elementOption = getElementOption([ x, y ], selectedElement.value);
                    if (elementOption) {
                        canvasConfig.elementOption = elementOption;
                    }
                    if (canvasConfig.elementOption) {
                        canvasConfig.isElementOption = true;
                        // 更新一下选中元素，防止不能数据不能更新
                        selectedElement.value = elements.value.find(element => element.id === selectedElement.value!.id);
                    } 
                }
                
                // 没有执行元素操作 下面选中某个元素
                if (!canvasConfig.isElementOption) {
                    const normalizedCanvasWidth = canvas.value!.width / canvasConfig.zoom;
                    const normalizedCanvasHeight = canvas.value!.height / canvasConfig.zoom;
                    const visibleElements = getVisibleElements(elements.value, canvasConfig.scrollX, canvasConfig.scrollY, normalizedCanvasWidth, normalizedCanvasHeight);
                    selectedElement.value = getPositionElement(visibleElements, canvasConfig.zoom, x, y, selectedElement.value);

                    // 选中了元素 未松开鼠标 执行移动操作
                    if (selectedElement.value) {
                        canvasConfig.elementOption = "MOVE";
                        canvasConfig.isElementOption = true;
                    }
                }
                
                renderElements(elements.value);
                break;
            }
            case OPTION_TYPE.PEN: {
                const { x, y } = getCanvasPointPosition(event, canvasConfig);
                targetElement = createPenElement({ x, y });
                canvasConfig.isDrawing = true;
                break;
            }
            case OPTION_TYPE.ERASER: {
                const { x, y } = getCanvasPointPosition(event, canvasConfig);
                startPoint = [x, y];
                canvasConfig.isDrawing = true;
                break;
            }
        }
    };

    const handleMove = throttleRAF((event: PointerEvent | TouchEvent) => {
        // 绘制
        if (canvasConfig.isDrawing) {
            switch (canvasConfig.optionType) {
                case OPTION_TYPE.MOUSE: {
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
                    const normalizedCanvasWidth = canvas.value!.width / canvasConfig.zoom;
                    const normalizedCanvasHeight = canvas.value!.height / canvasConfig.zoom;
                    const visibleElements = getVisibleElements(elements.value, canvasConfig.scrollX, canvasConfig.scrollY, normalizedCanvasWidth, normalizedCanvasHeight);
                    checkCrossElements(
                        startPoint,
                        x,
                        y,
                        visibleElements
                    );
                    renderElements(elements.value);
                    startPoint = [x, y];
                    break;
                }
            }
            return;
        } 
        
        // 缩放与移动
        if (canvasConfig.isMoveOrScale) {
            canvasMove(event);
            return;
        }

        if (canvasConfig.optionType === OPTION_TYPE.MOUSE) {
            const { x, y } = getCanvasPointPosition(event, canvasConfig);

            if (canvasConfig.isElementOption) {
                // 执行元素操作
                optionElement(startPoint, x, y);
                startPoint = [x, y];
                canvasConfig.isRecordElementOption = true;
                return;
            }

            // 对鼠标移动位置进行判断 是否处于元素之上
            const normalizedCanvasWidth = canvas.value!.width / canvasConfig.zoom;
            const normalizedCanvasHeight = canvas.value!.height / canvasConfig.zoom;
            const visibleElements = getVisibleElements(elements.value, canvasConfig.scrollX, canvasConfig.scrollY, normalizedCanvasWidth, normalizedCanvasHeight);
            hoverElement.value = getPositionElement(visibleElements, canvasConfig.zoom, x, y, selectedElement.value);

            if (!canvasConfig.isElementOption) {
                // 当元素存在时
                setElementOptiontMouseCursor(x, y);
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
        if (canvasConfig.isDrawing)  {
            switch (canvasConfig.optionType) {
                case OPTION_TYPE.MOUSE: {
                    // canvasMove(event);
                    break;
                }
                case OPTION_TYPE.PEN: {
                    if (!targetElement) return;
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
                    addHistorySnapshot(elements.value);
                    renderElements(elements.value);
                    break;
                }
                case OPTION_TYPE.ERASER: {
                    // 橡皮擦模式在结束时过滤掉删除的元素
                    elements.value = elements.value.filter(element => !element.isDelete);
                    addHistorySnapshot(elements.value);
                    renderElements(elements.value);
                    break;
                }
            }
        } else {
            canvasMove(event);
        }
        targetElement = null;
        startPoint = null;
        canvasConfig.isDrawing = false;

        // 如果在执行元素操作时松开鼠标 重新判定一下鼠标光标展示
        if (canvasConfig.isElementOption) {
            const { x, y } = getCanvasPointPosition(event, canvasConfig);
            setElementOptiontMouseCursor(x, y);

            if (canvasConfig.isRecordElementOption) {
                addHistorySnapshot(elements.value);
            }
        }

        canvasConfig.isElementOption = false;
    };

    const watchKeyDown = (event: KeyboardEvent) => {
        if (event.key === "Meta" || event.key === "Control") {
            canvasConfig.isMoveOrScale = true;
        }
    };

    const watchKeyUp = (event: KeyboardEvent) => {
        if (event.key === "Meta" || event.key === "Control") {
            canvasConfig.isMoveOrScale = false;
        }
    };

    return {
        handleDown,
        handleMove,
        handleUp,
        watchKeyUp,
        watchKeyDown
    };
};
