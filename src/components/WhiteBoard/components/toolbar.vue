<template>
    <div class="wb-toolbar">
        <div class="wb-setting"></div>
        <div class="wb-tool">
            <div
                class="wb-tool-btn"
                :class="optionType === OPTION_TYPE.MOUSE && 'active'"
                @click="selectedMode(OPTION_TYPE.MOUSE)"
            >
                <Mouse />
            </div>
            <div
                class="wb-tool-btn"
                :class="optionType === OPTION_TYPE.PEN && 'active'"
                @click="selectedMode(OPTION_TYPE.PEN)"
            >
                <Pen />
            </div>
        </div>
        <div class="wb-control"></div>
    </div>
</template>

<script setup lang="ts">
import { defineEmits, defineProps, toRefs } from "vue";
import Mouse from "../icons/mouse.vue";
import Pen from "../icons/pen.vue";
import { OPTION_TYPE } from "../config";

const emit = defineEmits(["updateOptionType"]);

const props = defineProps({
    optionType: {
        type: String,
        default: OPTION_TYPE.MOUSE
    }
});

const { optionType } = toRefs(props);

const selectedMode = (type: string) => {
    emit("updateOptionType", type);
};
</script>

<style scoped>
.wb-toolbar {
    position: absolute;
    bottom: 10px;
    z-index: 1;
    left: 0;
    right: 0;
    display: flex;
    padding: 0 15px;
    justify-content: space-between;
}

.wb-tool {
    border-radius: 5px;
    box-shadow: 0 0 0 1px rgb(0 0 0 / 1%), 1px 1px 5px rgb(0 0 0 / 15%);
    background-color: rgba(255, 255, 255, 0.96);
    padding: 10px 5px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.wb-tool-btn {
    width: 36px;
    height: 36px;
    border-radius: 5px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    margin: 0 5px;
}

.wb-tool-btn.active {
    background-color: #1e80ff;
}

.wb-tool-btn.active svg {
    fill: #fff;
    color: #fff;
}
</style>
