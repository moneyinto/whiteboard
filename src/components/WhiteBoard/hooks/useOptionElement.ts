import { Ref } from "vue";
import { ICanvasConfig, IElement, IElementOptions, IPoint } from "../types";
import {
    deepClone,
    ELEMENT_RESIZE,
    getBoundsCoordsFromPoints,
    getElementCenterOnCanvas,
    getTargetElement,
    normalizeAngle,
    rotate
} from "../utils";
import useRenderElement from "./useRenderElement";
import useUpdateElement from "./useUpdateElement";

export default (
    canvas: Ref<HTMLCanvasElement | null>,
    context: Ref<CanvasRenderingContext2D | null>,
    elements: Ref<IElement[]>,
    canvasConfig: ICanvasConfig,
    selectedElement: Ref<IElement | undefined>
) => {
    const { updateElement } = useUpdateElement();
    const { renderElements } = useRenderElement(
        canvas,
        context,
        canvasConfig,
        selectedElement
    );

    /**
     * 以元素坐标系为中心
     * 缩放都是以坐标系为中心变化
     * 以x坐标变化为例 左边拖拽缩放
     * 缩放比例为 scale
     * 拖拽左边时，左边框正式变化了坐标轴左边的部分
     * 为了保持元素右边位置不变，需要将元素进行左右平移，平移距离为坐标轴右边变化大小
     *
     * 旋转处理
     */

    /**
     * 横向变动
     * @param mx
     * @param my
     * @param sx
     * @param sy
     * @param direction
     * @param originX
     * @returns
     */
    const horizontalZoom = (
        mx: number,
        my: number,
        sx: number,
        sy: number,
        direction: number,
        originX: number
    ) => {
        const oldWidth = Math.abs(selectedElement.value!.width);
        const angle = selectedElement.value!.angle;

        // 在sx,sy以x轴平行的线段上取任意一点 绕sx，sy旋转angle
        const nPoint = [sx - 10, sy];
        const tn = rotate(nPoint[0], nPoint[1], sx, sy, angle);
        // 求 鼠标点 与 起始点的向量 在 tn点 与 起始点向量上投影的距离值 即为移动的距离
        // 向量a在向量b上的投影：设a、b向量的模分别为A、B，两向量夹角为θ，则a在b上的投影大小为Acosθ，而两向量的点积a·b=ABcosθ，所以cosθ=a·b/(AB)。则a在b上的投影为Acosθ=Aa·b/(AB)=a·b/B
        const a = { x: mx - sx, y: my - sy };
        const b = { x: tn[0] - sx, y: tn[1] - sy };
        // const A = Math.hypot(a.x, a.y);
        const B = Math.hypot(b.x, b.y);
        const a·b = a.x * b.x + a.y * b.y;

        // 移动距离
        const move = (a·b / B) * direction;

        const newWidth = oldWidth - move;
        const scaleX = newWidth / oldWidth;

        // 原点偏移
        const originOffset = Math.abs(originX) * (scaleX - 1);

        // 中心点偏移距离
        const centerOffset = (newWidth - oldWidth) / 2;

        return {
            width: newWidth,
            scaleX,
            ofx: originOffset * Math.cos(angle) * direction,
            ofy: originOffset * Math.sin(angle) * direction,
            cfx: centerOffset * Math.cos(angle) * direction,
            cfy: centerOffset * Math.sin(angle) * direction
        };
    };

    /**
     * 纵向变动
     * @param mx
     * @param my
     * @param sx
     * @param sy
     * @param direction
     * @param originY
     * @returns
     */
    const verticalZoom = (
        mx: number,
        my: number,
        sx: number,
        sy: number,
        direction: number,
        originY: number
    ) => {
        const oldHeight = Math.abs(selectedElement.value!.height);
        const angle = selectedElement.value!.angle;

        // 在sx,sy以y轴平行的线段上取任意一点 绕sx，sy旋转angle
        const nPoint = [sx, sy - 10];
        const tn = rotate(nPoint[0], nPoint[1], sx, sy, angle);
        // 求 鼠标点 与 起始点的向量 在 tn点 与 起始点向量上投影的距离值 即为移动的距离
        // 向量a在向量b上的投影：设a、b向量的模分别为A、B，两向量夹角为θ，则a在b上的投影大小为Acosθ，而两向量的点积a·b=ABcosθ，所以cosθ=a·b/(AB)。则a在b上的投影为Acosθ=Aa·b/(AB)=a·b/B
        const a = { x: mx - sx, y: my - sy };
        const b = { x: tn[0] - sx, y: tn[1] - sy };
        // const A = Math.hypot(a.x, a.y);
        const B = Math.hypot(b.x, b.y);
        const a·b = a.x * b.x + a.y * b.y;

        // 移动距离
        const move = (a·b / B) * direction;

        const newHeight = oldHeight - move;
        const scaleY = newHeight / oldHeight;

        // 原点偏移
        const originOffset = Math.abs(originY) * (scaleY - 1);

        // 中心点偏移距离
        const centerOffset = (newHeight - oldHeight) / 2;

        return {
            height: newHeight,
            scaleY,
            ofx: -originOffset * Math.sin(angle) * direction,
            ofy: originOffset * Math.cos(angle) * direction,
            cfx: -centerOffset * Math.sin(angle) * direction,
            cfy: centerOffset * Math.cos(angle) * direction
        };
    };

    const optionElement = (startPoint: IPoint | null, x: number, y: number) => {
        if (!selectedElement.value || !startPoint) return;
        const moveX = x - startPoint[0];
        const moveY = y - startPoint[1];
        const [minX, minY, maxX, maxY] = getBoundsCoordsFromPoints(
            selectedElement.value.points
        );
        const optionElement = getTargetElement(
            selectedElement.value!.id,
            elements.value
        );
        switch (
            (ELEMENT_RESIZE as IElementOptions)[canvasConfig.elementOption]
        ) {
            case ELEMENT_RESIZE.MOVE: {
                if (optionElement) {
                    updateElement(optionElement, {
                        x: selectedElement.value.x + moveX,
                        y: selectedElement.value.y + moveY
                    });
                }
                break;
            }
            case ELEMENT_RESIZE.ANGLE: {
                if (optionElement) {
                    const { cx, cy } = getElementCenterOnCanvas(
                        selectedElement.value
                    );
                    const startAngle = Math.atan2(
                        startPoint[1] - cy,
                        startPoint[0] - cx
                    );
                    const changeAngle = Math.atan2(y - cy, x - cx) - startAngle;
                    const angle = normalizeAngle(
                        selectedElement.value.angle + changeAngle
                    );
                    updateElement(optionElement, {
                        angle
                    });
                }
                break;
            }
            case ELEMENT_RESIZE.LEFT:
            case ELEMENT_RESIZE.LEFT_TOP:
            case ELEMENT_RESIZE.LEFT_BOTTOM:
            case ELEMENT_RESIZE.TOP:
            case ELEMENT_RESIZE.BOTTOM:
            case ELEMENT_RESIZE.RIGHT:
            case ELEMENT_RESIZE.RIGHT_TOP:
            case ELEMENT_RESIZE.RIGHT_BOTTOM: {
                const points: IPoint[] = deepClone(
                    selectedElement.value.points
                );
                const { cx, cy } = getElementCenterOnCanvas(
                    selectedElement.value!
                );
                const [tx, ty] = rotate(
                    selectedElement.value.x,
                    selectedElement.value.y,
                    cx,
                    cy,
                    selectedElement.value.angle
                );
                const scale = { x: 1, y: 1 };
                const rect = {
                    width: selectedElement.value.width,
                    height: selectedElement.value.height
                };
                const origin = { x: tx, y: ty };
                const center = { x: cx, y: cy };
                if (/LEFT/.test(canvasConfig.elementOption)) {
                    const { width, ofx, ofy, cfx, cfy, scaleX } =
                        horizontalZoom(
                            x,
                            y,
                            startPoint[0],
                            startPoint[1],
                            -1,
                            maxX
                        );
                    rect.width = width;
                    origin.x = origin.x + ofx;
                    origin.y = origin.y + ofy;
                    center.x = center.x + cfx;
                    center.y = center.y + cfy;
                    scale.x = scaleX;
                }

                if (/RIGHT/.test(canvasConfig.elementOption)) {
                    const { width, ofx, ofy, cfx, cfy, scaleX } =
                        horizontalZoom(
                            x,
                            y,
                            startPoint[0],
                            startPoint[1],
                            1,
                            minX
                        );
                    rect.width = width;
                    origin.x = origin.x + ofx;
                    origin.y = origin.y + ofy;
                    center.x = center.x + cfx;
                    center.y = center.y + cfy;
                    scale.x = scaleX;
                }

                if (/TOP/.test(canvasConfig.elementOption)) {
                    const { height, ofx, ofy, cfx, cfy, scaleY } = verticalZoom(
                        x,
                        y,
                        startPoint[0],
                        startPoint[1],
                        -1,
                        maxY
                    );
                    rect.height = height;
                    origin.x = origin.x + ofx;
                    origin.y = origin.y + ofy;
                    center.x = center.x + cfx;
                    center.y = center.y + cfy;
                    scale.y = scaleY;
                }

                if (/BOTTOM/.test(canvasConfig.elementOption)) {
                    const { height, ofx, ofy, cfx, cfy, scaleY } = verticalZoom(
                        x,
                        y,
                        startPoint[0],
                        startPoint[1],
                        1,
                        minY
                    );
                    rect.height = height;
                    origin.x = origin.x + ofx;
                    origin.y = origin.y + ofy;
                    center.x = center.x + cfx;
                    center.y = center.y + cfy;
                    scale.y = scaleY;
                }

                const [rx, ry] = rotate(
                    origin.x,
                    origin.y,
                    center.x,
                    center.y,
                    -selectedElement.value.angle
                );
                updateElement(optionElement!, {
                    width: rect.width,
                    height: rect.height,
                    points: points.map((point) => [
                        point[0] * scale.x,
                        point[1] * scale.y
                    ]),
                    x: rx,
                    y: ry
                });
                break;
            }
        }
        renderElements(elements.value);
    };

    return {
        optionElement
    };
};
