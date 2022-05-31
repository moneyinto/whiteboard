<template>
    <div class="wb-toolbar">
        <div class="wb-control">
            <Step
                disabled
                :inputValue="(Math.round(zoom * 100)) + '%'"
                @reduce="reduce('zoom')"
                @add="add('zoom')"
            />
        </div>

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
            <div
                class="wb-tool-btn clear-btn"
                @click="selectedMode(OPTION_TYPE.CLEAR)"
            >
                <Clear />
            </div>
        </div>

        <div class="wb-setting">
            <div class="wb-setting-card" :class="settingShow ? 'open' : 'close'">
                <div class="wb-setting-line">
                    <div class="wb-setting-label">颜色</div>
                    <div class="wb-setting-value">
                        <ColorPicker
                            :inputValue="strokeColor"
                            @update="color => selectedColor(color)"
                        />
                    </div>
                </div>
                <div class="wb-setting-line">
                    <div class="wb-setting-label">粗细</div>
                    <div class="wb-setting-value">
                        <Step
                            :inputValue="lineWidth"
                            @reduce="reduce('lineWidth')"
                            @add="add('lineWidth')"
                            @input="value => input(value, 'lineWidth')"
                        />
                    </div>
                </div>
            </div>
            <div class="wb-setting-btn" @click="settingShow = !settingShow">
                <Setting :class="!settingShow && 'close'" />
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { defineEmits, defineProps, ref, toRefs, watch } from "vue";
import { OPTION_TYPE } from "../config";
import Mouse from "../icons/Mouse.vue";
import Pen from "../icons/Pen.vue";
import Setting from "../icons/Setting.vue";
import Step from "./Step.vue";
import Clear from "../icons/Clear.vue";
import ColorPicker from "./ColorPicker/index.vue";

const emit = defineEmits(["update:optionType", "update:lineWidth", "update:strokeColor", "update:zoom", "zoomChange", "clear"]);

const props = defineProps({
    optionType: {
        type: String,
        requried: true
    },

    lineWidth: {
        type: Number,
        required: true
    },

    strokeColor: {
        type: String,
        required: true
    },

    zoom: {
        type: Number,
        required: true
    }
});

const { optionType, strokeColor, lineWidth, zoom } = toRefs(props);

const settingShow = ref(true);

const selectedMode = (type: string) => {
    if (type === OPTION_TYPE.CLEAR) {
        return emit("clear");
    }
    emit("update:optionType", type);
};

const selectedColor = (color: string) => {
    emit("update:strokeColor", color);
};

const reduce = (type: string) => {
    if (type === "zoom") {
        if (zoom.value === 0.1) return;
        const oldZoom = zoom.value;
        const newZoom = Number((oldZoom - 0.05 < 0.1 ? 0.1 : oldZoom - 0.05).toFixed(2));
        emit("update:zoom", newZoom);
        emit("zoomChange", newZoom, oldZoom);
        return;
    }
    if (lineWidth.value === 1) return;
    emit("update:lineWidth", lineWidth.value === 5 ? 1 : lineWidth.value - 5);
};

const add = (type: string) => {
    if (type === "zoom") {
        const oldZoom = zoom.value;
        const newZoom = Number((zoom.value + 0.05).toFixed(2));
        emit("update:zoom", newZoom);
        emit("zoomChange", newZoom, oldZoom);
        return;
    }
    emit("update:lineWidth", lineWidth.value === 1 ? 5 : lineWidth.value + 5);
};

const input = (value: number) => {
    emit("update:lineWidth", value);
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
    align-items: center;
}

.wb-tool, .wb-control {
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

.wb-tool svg {
    height: 15px;
}

.clear-btn svg {
    height: 22px;
}

.wb-tool-btn.active svg {
    fill: #fff;
    color: #fff;
}

.wb-setting {
    position: relative;
}

.wb-setting-btn {
    border-radius: 5px;
    box-shadow: 0 0 0 1px rgb(0 0 0 / 1%), 1px 1px 5px rgb(0 0 0 / 15%);
    background-color: rgba(255, 255, 255, 0.96);
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    cursor: pointer;
    position: relative;
    z-index: 1;
}

.wb-setting-btn svg.close {
    transform: rotate(0deg);
}

.wb-setting-btn svg {
    height: 20px;
    transition: 0.3s all ease;
    transform: rotate(180deg);
}

.wb-setting-card {
    position: absolute;
    bottom: 40px;
    right: 0;
    width: 200px;
    box-sizing: border-box;
    border-radius: 5px;
    box-shadow: 0 0 0 1px rgb(0 0 0 / 1%), 1px 1px 5px rgb(0 0 0 / 15%);
    background-color: rgba(255, 255, 255, 0.96);
    padding: 10px 15px;
}

@keyframes slideUp {
	0% {
		transform: translateY(calc(100% + 200px));
        opacity: 0;
	}		
	100% {
        opacity: 1;
		transform: translateY(0%);
	}	
}

@keyframes slideDown {
	0% {
        opacity: 1;
        transform: translateY(0%);
	}			
	100% {
        opacity: 0;
        transform: translateY(calc(100% + 200px));
	}	
}

.wb-setting-card.open {
    animation: slideUp 0.5s ease-in forwards;
    transition: 0.3s ease-in;
    transform-origin: 50% 0;
}

.wb-setting-card.close {
    animation: slideDown 0.5s ease-in forwards;
    transition: 0.3s ease-in;
    transform-origin: 50% 0;
}

.wb-setting-line +.wb-setting-line {
    margin-top: 10px;
}

.wb-setting-label {
    font-size: 14px;
    font-weight: 600;
}

.wb-setting-value {
    margin-top: 5px;
}
</style>
