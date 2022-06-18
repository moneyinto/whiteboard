import getStroke, { StrokeOptions } from "perfect-freehand";
import { OPTION_TYPE } from "../config";
import { IBoundsCoords, ICanvasConfig, IElement, IPoint } from "../types";

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
        y: (y - canvasConfig.offsetY) / canvasConfig.zoom - canvasConfig.scrollY
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
        y: (y - canvasConfig.offsetY) / canvasConfig.zoom
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
        scrollY: baseScrollY + zoomOffsetScrollY
    };
};

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
            maxY + element.y
        ];
    }

    return [
        element.x,
        element.y,
        element.x + element.width,
        element.y + element.height
    ];
};

// throttle callback to execute once per animation frame
export const throttleRAF = <T extends any[]>(fn: (...args: T) => void) => {
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
        last: true
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
                    element.points[i][1] + element.y
                ];
                const B = [
                    element.points[i + 1][0] + element.x,
                    element.points[i + 1][1] + element.y
                ];
                const C = startPonit;
                const D = [x, y];
                // 以A为起点 向量AC AB AD -> 证明 C D 点 在AB两边
                // 向量AB AC AD
                const AB = [B[0] - A[0], B[1] - A[1]];
                const AC = [C[0] - A[0], C[1] - A[1]];
                const AD = [D[0] - A[0], D[1] - A[1]];

                // 以C为起点 向量 CD CA CB -> 证明 A B 点 在CD两边
                // 向量 CD CA CB
                const CA = [A[0] - C[0], A[1] - C[1]];
                const CB = [B[0] - C[0], B[1] - C[1]];
                const CD = [D[0] - C[0], D[1] - C[1]];

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
        normalizedCanvasHeight - scrollY
    ];
};

/**
 * 获取符合位置点所在的元素
 * @param elements 
 * @param zoom 
 * @param x 
 * @param y 
 * @returns 
 */
export const getPositionElement = (
    elements: IElement[],
    zoom: number,
    x: number,
    y: number
) => {
    // 只通过一个点确定不准！！！！！！！！！！！！！！ 方案二 采用邻居两个点的线段 判断移动点距离两点的距离和与两点之间的距离进行比较 再结合方案一 来提升精度
    // 下面方法暂时为判断绘制线条！！！！！！！！
    // 等可以绘制形状后再补充完善方法！！！！！！！！！！！
    // 计算鼠标点位与元素点位之间的距离来确认是否选中到元素
    // 定义判断基础距离
    const distance = 10 * zoom;
    let hoverElement: IElement | undefined;
    for (const element of elements) {
        // 对可视区域元素进行进一步的过滤 降低计算
        const [minX, minY, maxX, maxY] = getElementBoundsCoords(element);
        if (x > minX && x < maxX && y > minY && y < maxY) {
            // 符合条件的元素（线条）进行进一步判断
            const mousePoint = {
                x: x - element.x,
                y: y - element.y
            };

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
                const A = [element.points[i][0], element.points[i][1]];
                const B = [element.points[i + 1][0], element.points[i + 1][1]];
                // 与A点的距离
                const rA = Math.hypot(A[0] - mousePoint.x, A[1] - mousePoint.y);
                // 与B点的距离
                const rB = Math.hypot(B[0] - mousePoint.x, B[1] - mousePoint.y);
                // AB点距离
                const rAB = Math.hypot(A[0] - B[0], A[1] - B[0]);
                // 判断条件 -- 1、与A点距离小于distance 2、与B点距离小于distance 3、与A点距离 与B点距离 两者之和 与 AB点距离 的差 小于 distance
                // 三个条件满足一个即为符合要求的元素
                if (rA < distance || rB < distance || (rAB - rA - rB) < distance) {
                    hoverElement =  element;
                    break;
                }
            }

            // 已找到符合条件的 退出循环
            if (hoverElement) break;
        }
    }
    return hoverElement;
};
