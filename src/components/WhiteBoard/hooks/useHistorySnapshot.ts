import { debounce } from "lodash";
import { ref } from "vue";
import { IElement } from "../types";
import db from "../utils/db";

export default () => {
    const snapshotCursor = ref(0);

    const updateSnapshotCursor = async () => {
        //
    };

    // 新增历史快照
    const addHistorySnapshot = debounce((elements: IElement[]) => {
        db.setData(elements);
    }, 300);

    const getHistorySnapshot = async () => {
        return await db.getData();
    };

    // 撤销
    const undo = () => {
        //
    };

    // 恢复
    const redo = () => {
        //
    };

    return {
        addHistorySnapshot,
        getHistorySnapshot,
        undo,
        redo,
        snapshotCursor
    }
};