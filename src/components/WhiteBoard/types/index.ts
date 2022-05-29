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
    type: "pen";
    angle: number;
    isDelete: boolean;
    locked: boolean;
    x: number;
    y: number;
    width: number;
    height: number;
}

export type IElement = IPenElement;

export type IPoint = number[];

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
}

export type IBoundsCoords = [number, number, number, number];
