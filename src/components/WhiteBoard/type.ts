
/**
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
    angle: number;
    isDelete: boolean;
    locked: boolean;
    x: number;
    y: number;
    width: number;
    height: number;
}

export type IElement = IPenElement;

type IPoint = [number, number];

export interface IPenElement extends IBaseElement {
    points: IPoint[]
}