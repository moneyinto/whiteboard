import { IDBPDatabase, openDB } from "idb";
import { IElement } from "../types";

const DB_NAME = "WHITE_BOARD_DB";

class DB {
    private db: IDBPDatabase | undefined;
    async init() {
        if (!this.db) {
            this.db = await openDB(DB_NAME, 1, {
                upgrade(db) {
                    if (!db.objectStoreNames.contains("history")) {
                        const objectStore = db.createObjectStore("history", {
                            keyPath: "id",
                            autoIncrement: true
                        });
                        objectStore.createIndex("id", "id", {
                            unique: true
                        });
                    }
                }
            });
        }
    }

    async delete(keys: number[]) {
        for (const key of keys) {
            await this.db?.transaction("history", "readwrite").objectStore("history").delete(key);
        }
    }

    async getData(key: number) {
        return await this.db?.transaction("history").objectStore("history").get(key);
    }

    async getAllKeys() {
        return await this.db?.transaction("history").objectStore("history").getAllKeys();
    }

    async setData(elements: IElement[]) {
        this.db
            ?.transaction("history", "readwrite")
            .objectStore("history")
            .add({elements: JSON.parse(JSON.stringify(elements))})
    }
}

export default new DB();
