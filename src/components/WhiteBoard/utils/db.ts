import { IDBPDatabase, openDB } from "idb";
import { IElement } from "../types";

const DB_NAME = "WHITE_BOARD_DB";

class DB {
    private db: IDBPDatabase | undefined;
    async init() {
        if (!this.db) {
            console.log("======ww========");
            this.db = await openDB(DB_NAME, 1, {
                upgrade(db) {
                    console.log("==============");
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

    async getData(query?: string) {
        return await this.db?.transaction("history").objectStore("history").get(3);
    }

    async setData(elements: IElement[]) {
        this.db
            ?.transaction("history", "readwrite")
            .objectStore("history")
            .add({elements: JSON.parse(JSON.stringify(elements))})
    }
}

export default new DB();
