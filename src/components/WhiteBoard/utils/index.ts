import getStroke, { StrokeOptions } from "perfect-freehand";
import { OPTION_TYPE } from "../config";
import {
    IBoundsCoords,
    ICanvasConfig,
    IElement,
    IPoint,
    IRects,
    IRectParameter,
} from "../types";

export const deepClone = (obj: unknown) => {
    return JSON.parse(JSON.stringify(obj));
};

/**
 * 生成随机码
 * @param len 随机码长度
 */
export const createRandomCode = (len = 10): string => {
    const charset = `_0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz`;
    const maxLen = charset.length;
    let ret = "";
    for (let i = 0; i < len; i++) {
        const randomIndex = Math.floor(Math.random() * maxLen);
        ret += charset[randomIndex];
    }
    return ret;
};

/**
 * 获取鼠标点在canvas的坐标
 * @param event
 * @param canvasConfig
 * @returns
 */
export const getCanvasPointPosition = (
    event: PointerEvent | TouchEvent,
    canvasConfig: ICanvasConfig
) => {
    const x =
        event instanceof TouchEvent
            ? event.targetTouches[0].clientX
            : event.clientX;
    const y =
        event instanceof TouchEvent
            ? event.targetTouches[0].clientY
            : event.clientY;
    return {
        x:
            (x - canvasConfig.offsetX) / canvasConfig.zoom -
            canvasConfig.scrollX,
        y:
            (y - canvasConfig.offsetY) / canvasConfig.zoom -
            canvasConfig.scrollY,
    };
};

/**
 * 获取鼠标点在黑板的坐标
 * @param event
 * @param canvasConfig
 * @returns
 */
export const getWhiteBoardPointPosition = (
    event: PointerEvent | TouchEvent,
    canvasConfig: ICanvasConfig
) => {
    const x =
        event instanceof TouchEvent
            ? event.targetTouches[0].clientX
            : event.clientX;
    const y =
        event instanceof TouchEvent
            ? event.targetTouches[0].clientY
            : event.clientY;
    return {
        x: (x - canvasConfig.offsetX) / canvasConfig.zoom,
        y: (y - canvasConfig.offsetY) / canvasConfig.zoom,
    };
};

/**
 * 获取缩放后对应点的scroll
 * @param x
 * @param y
 * @param canvasConfig
 * @param newZoom
 * @param oldZoom
 * @returns
 */
export const getZoomScroll = (
    x: number,
    y: number,
    canvasConfig: ICanvasConfig,
    newZoom: number,
    oldZoom: number
) => {
    const clientX = x - canvasConfig.offsetX;
    const clientY = y - canvasConfig.offsetY;

    // get original scroll position without zoom
    const baseScrollX = canvasConfig.scrollX + (clientX - clientX / oldZoom);
    const baseScrollY = canvasConfig.scrollY + (clientY - clientY / oldZoom);

    // get scroll offsets for target zoom level
    const zoomOffsetScrollX = -(clientX - clientX / newZoom);
    const zoomOffsetScrollY = -(clientY - clientY / newZoom);

    return {
        scrollX: baseScrollX + zoomOffsetScrollX,
        scrollY: baseScrollY + zoomOffsetScrollY,
    };
};

/**
 * 获取所有点形成的区域的 最小横纵坐标值 和 最大横纵坐标值
 * @param points
 * @returns
 */
export const getBoundsCoordsFromPoints = (points: IPoint[]): IBoundsCoords => {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const [x, y] of points) {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
    }

    return [minX, minY, maxX, maxY];
};

/**
 * 获取元素中心点在canvas中的坐标
 * @param element
 * @returns
 */
export const getElementCenterOnCanvas = (element: IElement) => {
    const [minX, minY, maxX, maxY] = getElementBoundsCoords(element);
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;
    return { cx, cy, minX, minY, maxX, maxY };
};

/**
 * 获取元素形成矩形最小坐标位置及最大坐标位置
 * @param element
 */
export const getElementBoundsCoords = (element: IElement): IBoundsCoords => {
    if (element.type === OPTION_TYPE.PEN) {
        const [minX, minY, maxX, maxY] = getBoundsCoordsFromPoints(
            element.points
        );
        return [
            minX + element.x,
            minY + element.y,
            maxX + element.x,
            maxY + element.y,
        ];
    }

    return [
        element.x,
        element.y,
        element.x + element.width,
        element.y + element.height,
    ];
};

// throttle callback to execute once per animation frame
export const throttleRAF = <T extends unknown[]>(fn: (...args: T) => void) => {
    let handle: number | null = null;
    let lastArgs: T | null = null;
    let callback: ((...args: T) => void) | null = null;
    const ret = (...args: T) => {
        if (process.env.NODE_ENV === "test") {
            fn(...args);
            return;
        }
        lastArgs = args;
        callback = fn;
        if (handle === null) {
            handle = window.requestAnimationFrame(() => {
                handle = null;
                lastArgs = null;
                callback = null;
                fn(...args);
            });
        }
    };
    ret.flush = () => {
        if (handle !== null) {
            cancelAnimationFrame(handle);
            handle = null;
        }
        if (lastArgs) {
            const _lastArgs = lastArgs;
            const _callback = callback;
            lastArgs = null;
            callback = null;
            if (_callback !== null) {
                _callback(..._lastArgs);
            }
        }
    };
    ret.cancel = () => {
        lastArgs = null;
        callback = null;
        if (handle !== null) {
            cancelAnimationFrame(handle);
            handle = null;
        }
    };
    return ret;
};

const TO_FIXED_PRECISION = /(\s?[A-Z]?,?-?[0-9]*\.[0-9]{0,2})(([0-9]|e|-)*)/g;
function med(A: number[], B: number[]) {
    return [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2];
}

/**
 * 处理笔记转化为svg path
 * @param points
 * @returns
 */
export const getPenSvgPath = (points: number[][], lineWidth: number) => {
    const options: StrokeOptions = {
        simulatePressure: true, // 是否基于速度模拟压力
        size: lineWidth,
        thinning: 0.6,
        smoothing: 0.5,
        streamline: 0.5,
        easing: (t) => Math.sin((t * Math.PI) / 2),
        last: false,
    };
    const storkePoints = getStroke(points, options);
    const max = storkePoints.length - 1;
    const svgPathData = storkePoints
        .reduce(
            (acc, point, i, arr) => {
                if (i === max) {
                    acc.push(point, med(point, arr[0]), "L", arr[0], "Z");
                } else {
                    acc.push(point, med(point, arr[i + 1]));
                }
                return acc;
            },
            ["M", storkePoints[0], "Q"]
        )
        .join(" ")
        .replace(TO_FIXED_PRECISION, "$1");
    const path = new Path2D(svgPathData);
    return path;
};

/**
 * 向量叉乘
 * @param v1
 * @param v2
 * @returns
 */
export const crossMul = (v1: IPoint, v2: IPoint) => {
    return v1[0] * v2[1] - v1[1] * v2[0];
};

/**
 * 获取存在交叉的元素
 * @param startPonit
 * @param x
 * @param y
 * @param elements
 */
export const checkCrossElements = (
    startPonit: IPoint,
    x: number,
    y: number,
    elements: IElement[]
) => {
    // ！！！！！！！！！！！！！！暂不考虑线条粗细的情况
    // 交点的方式 当线条特别短时不是很灵敏！！！！！！！！！！！
    // ！！！！！可以考虑点到点两点之间距离小于多少为一个判断的界限来判定 只要存在一点 与 橡皮点 的直线值小于 min 则认为橡皮擦除到改元素
    // 过滤元素 只对可视区域元素进行判断 降低不必要的性能损耗
    for (const element of elements) {
        const [minX, minY, maxX, maxY] = getBoundsCoordsFromPoints(
            element.points
        );
        if (
            !(
                (element.x + minX > Math.max(startPonit[0], x) &&
                    element.y + minY > Math.max(startPonit[1], y)) ||
                (element.x + maxX < Math.min(startPonit[0], x) &&
                    element.y + maxY < Math.min(startPonit[1], y))
            ) &&
            !element.isDelete
        ) {
            // 元素为一个点的情况 或者元素比较小，点都都集中在某个小范围内
            // 进一步优化交点方法不灵敏问题
            if (
                (maxX - minX < 5 && maxY - minY < 5) ||
                element.points.length === 2
            ) {
                const r = Math.hypot(x - element.x, y - element.y);
                if (r < 5) return (element.isDelete = true);
            }

            // 下面对存在交点的情况 进行进一步判断
            // 通过向量的叉乘进行判断
            // 向量a×向量b（×为向量叉乘），若结果小于0，表示向量b在向量a的顺时针方向；若结果大于0，表示向量b在向量a的逆时针方向；若等于0，表示向量a与向量b平行
            // 假设有两条线段AB，CD，若AB，CD相交
            // 线段AB与CD所在的直线相交，即点A和点B分别在直线CD的两边
            // 线段CD与AB所在的直线相交，即点C和点D分别在直线AB的两边
            // 两个条件同时满足是两线段相交的充要条件，所以我们只需要证明点A和点B分别在直线CD的两边，点C和点D分别在直线AB的两边，这样便可以证明线段AB与CD相交
            for (let i = 0; i < element.points.length - 1; i++) {
                const A = [
                    element.points[i][0] + element.x,
                    element.points[i][1] + element.y,
                ];
                const B = [
                    element.points[i + 1][0] + element.x,
                    element.points[i + 1][1] + element.y,
                ];
                const C = startPonit;
                const D = [x, y];
                // 以A为起点 向量AC AB AD -> 证明 C D 点 在AB两边
                // 向量AB AC AD
                const AB: IPoint = [B[0] - A[0], B[1] - A[1]];
                const AC: IPoint = [C[0] - A[0], C[1] - A[1]];
                const AD: IPoint = [D[0] - A[0], D[1] - A[1]];

                // 以C为起点 向量 CD CA CB -> 证明 A B 点 在CD两边
                // 向量 CD CA CB
                const CA: IPoint = [A[0] - C[0], A[1] - C[1]];
                const CB: IPoint = [B[0] - C[0], B[1] - C[1]];
                const CD: IPoint = [D[0] - C[0], D[1] - C[1]];

                // 向量叉乘 一正一负 证明则成立
                if (
                    Math.sign(crossMul(AC, AB) * crossMul(AD, AB)) === -1 &&
                    Math.sign(crossMul(CA, CD) * crossMul(CB, CD)) === -1
                ) {
                    element.isDelete = true;
                    break;
                }
            }
        }
    }
};

/**
 * 过滤获取可视区域内的元素
 * @param elements
 * @param scrollX
 * @param scrollY
 * @param normalizedCanvasWidth
 * @param normalizedCanvasHeight
 * @returns
 */
export const getVisibleElements = (
    elements: IElement[],
    scrollX: number,
    scrollY: number,
    normalizedCanvasWidth: number,
    normalizedCanvasHeight: number
) => {
    const [viewMinX, viewMinY, viewMaxX, viewMaxY] = getViewCanvasBoundsCoords(
        scrollX,
        scrollY,
        normalizedCanvasWidth,
        normalizedCanvasHeight
    );
    return elements.filter((element) => {
        const [minX, minY, maxX, maxY] = getElementBoundsCoords(element);
        return (
            maxX > viewMinX &&
            maxY > viewMinY &&
            minX < viewMaxX &&
            minY < viewMaxY
        );
    });
};

/**
 * 获取可视区域最小坐标和最大坐标
 * @param scrollX
 * @param scrollY
 * @param normalizedCanvasWidth
 * @param normalizedCanvasHeight
 * @returns
 */
export const getViewCanvasBoundsCoords = (
    scrollX: number,
    scrollY: number,
    normalizedCanvasWidth: number,
    normalizedCanvasHeight: number
) => {
    return [
        0 - scrollX,
        0 - scrollY,
        normalizedCanvasWidth - scrollX,
        normalizedCanvasHeight - scrollY,
    ];
};

/**
 * 获取符合位置点所在的元素
 * @param elements
 * @param zoom
 * @param x
 * @param y
 * @param selectedElement
 * @returns
 */
export const getPositionElement = (
    elements: IElement[],
    zoom: number,
    x: number,
    y: number,
    selectedElement: IElement | undefined
) => {
    // 未计算线条宽度！！！！！！！！！！！！！
    // 只通过一个点确定不准！！！！！！！！！！！！！！ 方案二 采用邻居两个点的线段 判断移动点距离两点的距离和与两点之间的距离进行比较 再结合方案一 来提升精度
    // 下面方法暂时为判断绘制线条！！！！！！！！
    // 等可以绘制形状后再补充完善方法！！！！！！！！！！！
    // 计算鼠标点位与元素点位之间的距离来确认是否选中到元素
    // 定义判断基础距离
    const distance = 5 * zoom;
    let hoverElement: IElement | undefined;
    for (const element of elements) {
        // 对可视区域元素进行进一步的过滤 降低计算
        const [minX, minY, maxX, maxY] = getElementBoundsCoords(element);
        const cx = (minX + maxX) / 2;
        const cy = (minY + maxY) / 2;
        const [nx, ny] = rotate(x, y, cx, cy, -element.angle);
        if (nx > minX && nx < maxX && ny > minY && ny < maxY) {
            // 符合条件的元素（线条）进行进一步判断
            const mousePoint = {
                x: nx - element.x,
                y: ny - element.y,
            };

            if (selectedElement && selectedElement.id === element.id) {
                hoverElement = selectedElement;
                break;
            }

            // 方案一
            // for (const point of element.points) {
            //     const r = Math.hypot(point[0] - mousePoint.x, point[1] - mousePoint.y);
            //     if (r < distance) {
            //         // 符合条件
            //         hoverElement = element;
            //         break;
            //     }
            // }

            // 方案二
            for (let i = 0; i < element.points.length - 1; i++) {
                const A = element.points[i];
                const B = element.points[i + 1];
                // 与A点的距离
                const rA = Math.hypot(A[0] - mousePoint.x, A[1] - mousePoint.y);
                // 与B点的距离
                const rB = Math.hypot(B[0] - mousePoint.x, B[1] - mousePoint.y);
                // AB点距离
                const rAB = Math.hypot(A[0] - B[0], A[1] - B[1]);
                // 判断条件 -- 1、与A点距离小于distance 2、与B点距离小于distance 3、与A点距离 与B点距离 两者之和 与 AB点距离 的差 小于 distance
                // 三个条件满足一个即为符合要求的元素
                if (
                    rA < distance ||
                    rB < distance ||
                    rA + rB - rAB < distance
                ) {
                    hoverElement = element;
                    break;
                }
            }

            // 已找到符合条件的 退出循环
            if (hoverElement) break;
        }
    }

    return hoverElement ? (deepClone(hoverElement) as IElement) : undefined;
};

/**
 *
 * @param param0 获取选中区域的九点区域坐标
 * @returns
 */
export const getElementResizePoints = (
    x: number,
    y: number,
    elementWidth: number,
    elementHeight: number,
    dashedLinePadding: number,
    resizeRectWidth: number
) => {
    const LEFT_X = x - dashedLinePadding - resizeRectWidth;
    const RIGH_X = x + elementWidth + dashedLinePadding;
    const CENTER_X = (RIGH_X + LEFT_X) / 2;
    const TOP_Y = y - dashedLinePadding - resizeRectWidth;
    const BOTTOM_Y = y + elementHeight + dashedLinePadding;
    const CENTER_Y = (BOTTOM_Y + TOP_Y) / 2;

    const LEFT_TOP: IRectParameter = [
        LEFT_X,
        TOP_Y,
        resizeRectWidth,
        resizeRectWidth,
    ];
    const LEFT: IRectParameter = [
        LEFT_X,
        CENTER_Y,
        resizeRectWidth,
        resizeRectWidth,
    ];
    const LEFT_BOTTOM: IRectParameter = [
        LEFT_X,
        BOTTOM_Y,
        resizeRectWidth,
        resizeRectWidth,
    ];
    const TOP: IRectParameter = [
        CENTER_X,
        TOP_Y,
        resizeRectWidth,
        resizeRectWidth,
    ];
    const BOTTOM: IRectParameter = [
        CENTER_X,
        BOTTOM_Y,
        resizeRectWidth,
        resizeRectWidth,
    ];
    const RIGHT_TOP: IRectParameter = [
        RIGH_X,
        TOP_Y,
        resizeRectWidth,
        resizeRectWidth,
    ];
    const RIGHT: IRectParameter = [
        RIGH_X,
        CENTER_Y,
        resizeRectWidth,
        resizeRectWidth,
    ];
    const RIGHT_BOTTOM: IRectParameter = [
        RIGH_X,
        BOTTOM_Y,
        resizeRectWidth,
        resizeRectWidth,
    ];
    const ANGLE: IRectParameter = [
        CENTER_X,
        TOP_Y - resizeRectWidth * 2,
        resizeRectWidth,
        resizeRectWidth,
    ];
    return {
        LEFT_TOP,
        LEFT,
        LEFT_BOTTOM,
        TOP,
        BOTTOM,
        RIGHT_TOP,
        RIGHT,
        RIGHT_BOTTOM,
        ANGLE,
    };
};

export enum ELEMENT_RESIZE {
    LEFT_TOP = "nwse-resize",
    LEFT = "ew-resize",
    LEFT_BOTTOM = "nesw-resize",
    TOP = "ns-resize",
    BOTTOM = "ns-resize",
    RIGHT_TOP = "nesw-resize",
    RIGHT = "ew-resize",
    RIGHT_BOTTOM = "nwse-resize",
    ANGLE = "grabbing",
    MOVE = "move",
}

// 计算 |p1 p2| X |p1 p|
export const getCross = (p1: IPoint, p2: IPoint, p: IPoint) => {
    return (p2[0] - p1[0]) * (p[1] - p1[1]) - (p[0] - p1[0]) * (p2[1] - p1[1]);
};

/**
 * 判断点是否在区域内
 * @param point
 * @param rect
 * @returns
 */
export const checkPointInRect = (
    point: IPoint,
    rect: IRectParameter,
    cx: number,
    cy: number,
    angle: number
) => {
    // 方案一
    // 当元素存在旋转的时候
    // 处理矩形区域的旋转后的四个点
    // 判断鼠标触摸点是否在旋转后的矩形区域内
    /**
     * A-----------------------B
     * |                       |
     * |                       |
     * |        E              |
     * |                       | 
     * D-----------------------C
     * 
     * 只要判断(AB X AE ) * (CD X CE) >= 0 就说明E在AD和BC中间夹着
     * 同理(DA X DE ) * (BC X BE) >= 0 计算另两边AB, CD就可以了
     * 即(AB X AE ) * (CD X CE)  >= 0 && (DA X DE ) * (BC X BE) >= 0，则该点在矩形区域内
     */
    // const rw = rect[2];
    // const rh = rect[3];
    // const p1 = [rect[0], rect[1]];
    // const p2 = [rect[0] + rw, rect[1]];
    // const p3 = [rect[0], rect[1] + rh];
    // const p4 = [rect[0] + rw, rect[1] + rh];
    // const tp1 = rotate(p1[0], p1[1], cx, cy, angle);
    // const tp2 = rotate(p2[0], p2[1], cx, cy, angle);
    // const tp3 = rotate(p3[0], p3[1], cx, cy, angle);
    // const tp4 = rotate(p4[0], p4[1], cx, cy, angle);
    // return (
    //     getCross(tp1, tp2, point) * getCross(tp4, tp3, point) >= 0 &&
    //     getCross(tp2, tp4, point) * getCross(tp3, tp1, point) >= 0
    // );
    // 方案二
    // 当元素存在旋转的时候
    // 不处理矩形区域的旋转后的四个点
    // 逆向思维 逆向旋转鼠标触摸点
    // 判断逆向旋转鼠标触摸点是否在矩形区域内
    const translatePoint = rotate(point[0], point[1], cx, cy, -angle);
    const minX = rect[0];
    const maxX = rect[0] + rect[2];
    const minY = rect[1];
    const maxY = rect[1] + rect[3];
    return (
        translatePoint[0] > minX &&
        translatePoint[0] < maxX &&
        translatePoint[1] > minY &&
        translatePoint[1] < maxY
    );
};

/**
 * 获取当前鼠标对元素的操作
 * @param point
 * @param elements
 * @returns
 */
export const getElementOption = (
    point: IPoint,
    element: IElement,
    zoom: number
) => {
    const [minX, minY, maxX, maxY] = getElementBoundsCoords(element);
    const elementWidth = maxX - minX;
    const elementHeight = maxY - minY;
    const dashedLinePadding = 4 / zoom;
    const rectWidth = 8 / zoom;
    const rects: IRects = getElementResizePoints(
        minX,
        minY,
        elementWidth,
        elementHeight,
        dashedLinePadding,
        rectWidth
    );
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;
    let elementOption = "";
    for (const key in rects) {
        if (checkPointInRect(point, rects[key], cx, cy, element.angle)) {
            elementOption = key;
            break;
        }
    }
    return elementOption;
};

/**
 * 获取目标元素
 * @param id
 * @param elements
 * @returns
 */
export const getTargetElement = (id: string, elements: IElement[]) => {
    return elements.find((element) => element.id === id);
};

/**
 * 角度计算（将角度转换成0-360）
 * @param angle
 * @returns
 */
export const normalizeAngle = (angle: number): number => {
    if (angle >= 2 * Math.PI) {
        return angle - 2 * Math.PI;
    }
    return angle;
};

/**
 * 旋转坐标点
 * @param x1
 * @param y1
 * @param x2
 * @param y2
 * @param angle
 * @returns
 */
export const rotate = (
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    angle: number
): IPoint => {
    // 𝑎′𝑥=(𝑎𝑥−𝑐𝑥)cos𝜃−(𝑎𝑦−𝑐𝑦)sin𝜃+𝑐𝑥
    // 𝑎′𝑦=(𝑎𝑥−𝑐𝑥)sin𝜃+(𝑎𝑦−𝑐𝑦)cos𝜃+𝑐𝑦.
    // https://math.stackexchange.com/questions/2204520/how-do-i-rotate-a-line-segment-in-a-specific-point-on-the-line
    return [
        (x1 - x2) * Math.cos(angle) - (y1 - y2) * Math.sin(angle) + x2,
        (x1 - x2) * Math.sin(angle) + (y1 - y2) * Math.cos(angle) + y2,
    ];
};
