/**
 * type: 元素类型 (pen: 笔记)
 * 
 * angle: 旋转角度
 *
 * isDelete: 是否删除
 *
 * locked: 是否锁定
 *
 * x: 元素横坐标
 *
 * y: 元素纵坐标
 *
 * width: 元素占位宽
 *
 * height: 元素占位高
 */
interface IBaseElement {
    id: string;
    type: "PEN";
    angle: number;
    isDelete: boolean;
    locked: boolean;
    x: number;
    y: number;
    width: number;
    height: number;
    [key: string]: unknown;
}

export type IElement = IPenElement;

export type IPoint = [number, number];

export interface IPenElement extends IBaseElement {
    points: IPoint[];
    lineWidth: number;
    strokeColor: string;
}

/**
 * offsetX: canvas距离window左边框距离
 * 
 * offsetY: canvas距离window上边框距离
 * 
 * scrollX: canvas横向位移
 * 
 * scrollY: canvas纵向位移
 * 
 * zoom: canvas缩放比例
 * 
 * optionType: 操作类型
 * 
 * isDrawing: 是否处于绘制阶段
 * 
 * isMoveOrScale: 是否处于移动和缩放阶段
 * 
 * elementOption: 对元素执行的操作 移动 旋转 拉伸
 * 
 * isElementOption: 是否对元素进行操作
 * 
 * isRecordElementOption: 是否需要记录对元素的操作
 */
export interface ICanvasConfig {
    offsetX: number;
    offsetY: number;
    scrollX: number;
    scrollY: number;
    zoom: number;
    optionType: string;
    lineWidth: number;
    strokeColor: string;
    isDrawing: boolean;
    isMoveOrScale: boolean;
    elementOption: string;
    isElementOption: boolean;
    isRecordElementOption: boolean;
}

export type IBoundsCoords = [number, number, number, number];

export type IRectParameter = IBoundsCoords;

export type IRects = Record<string, IRectParameter>;

export type IElementOptions = Record<string, string>;