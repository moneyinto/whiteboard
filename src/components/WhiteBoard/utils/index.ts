import getStroke, { StrokeOptions } from "perfect-freehand";
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
    const x = (event instanceof TouchEvent) ? event.targetTouches[0].clientX : event.clientX;
    const y = (event instanceof TouchEvent) ? event.targetTouches[0].clientY : event.clientY;
    return {
        x: (x - canvasConfig.offsetX) / canvasConfig.zoom - canvasConfig.scrollX,
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
    const x = (event instanceof TouchEvent) ? event.targetTouches[0].clientX : event.clientX;
    const y = (event instanceof TouchEvent) ? event.targetTouches[0].clientY : event.clientY;
    return {
        x:
            (x - canvasConfig.offsetX) / canvasConfig.zoom,
        y:
            (y - canvasConfig.offsetY) / canvasConfig.zoom
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
    if (element.type === "pen") {
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

/**
 * 节流
 * @param fn 
 * @param wait 
 * @returns 
 */
export const throttle = (fn: () => void, wait: number) => {
    const callback = fn;    
    let timerId = 0;

    // 是否是第一次执行
    let firstInvoke = true;

    function throttled() {
        // 如果是第一次触发，直接执行
        if (firstInvoke) {
            callback();
            firstInvoke = false;
            return ;
        }

        // 如果定时器已存在，直接返回。        
        if (timerId) {
            return ;
        }

        timerId = setTimeout(function() {  
            clearTimeout(timerId);
            timerId = 0;
            callback();
        }, wait);
    }

    // 返回一个闭包
    return throttled;
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
export const getPenSvgPath = (points: number[][]) => {
    const options: StrokeOptions = {
        simulatePressure: true, // 是否基于速度模拟压力
        size: 2 * 4.25,
        thinning: 0.6,
        smoothing: 0.5,
        streamline: 0.5,
        easing: (t) => Math.sin((t * Math.PI) / 2)
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
            ["M", points[0], "Q"]
        )
        .join(" ")
        .replace(TO_FIXED_PRECISION, "$1");
    const path = new Path2D(svgPathData);
    return path;
};
