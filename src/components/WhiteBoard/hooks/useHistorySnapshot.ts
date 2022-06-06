import { debounce, zip } from "lodash";
import { Ref } from "vue";
import { IElement } from "../types";
import db from "../utils/db";

export default (elements: Ref<IElement[]>, snapshotKeys: Ref<number[]>, snapshotCursor: Ref<number>, renderElements?: (elements: IElement[]) => void) => {
    // 新增历史快照
    const addHistorySnapshot = debounce(async (elements: IElement[]) => {
        // 当快照指针不是指向与最后一个 需要删除指针之后的记录
        if (snapshotCursor.value < snapshotKeys.value.length - 1) {
            await db.delete(snapshotKeys.value.slice(snapshotCursor.value + 1));
        }
        await db.setData(elements);

        await getHistorySnapshot();
    }, 300);

    const getHistorySnapshot = async () => {
        snapshotKeys.value = (await db.getAllKeys()) as number[];
        if (!snapshotKeys.value || snapshotKeys.value.length === 0) return { elements: [] };
        const history = await db.getData(snapshotKeys.value[snapshotKeys.value.length - 1] as number);
        snapshotCursor.value = snapshotKeys.value.length - 1;
        elements.value = history.elements;
    };

    // 撤销
    const undo = async () => {
        if (snapshotCursor.value > -1) {
            snapshotCursor.value--;
            render();
        }
    };

    // 恢复
    const redo = () => {
        if (snapshotCursor.value < snapshotKeys.value.length - 1) {
            snapshotCursor.value++;
            render();            
        }
    };

    const render = async () => {
        if (snapshotCursor.value === -1) {
            elements.value = [];
            return renderElements && renderElements([]);
        }
        const key = snapshotKeys.value[snapshotCursor.value];
        const history = await db.getData(key);
        elements.value = history.elements;
        renderElements && renderElements(history.elements);
    };

    return {
        addHistorySnapshot,
        getHistorySnapshot,
        undo,
        redo
    }
};