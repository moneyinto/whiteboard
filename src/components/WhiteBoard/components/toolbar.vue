<template>
    <div class="wb-toolbar">
        <div class="wb-control"></div>

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

        <div class="wb-setting">
            <div class="wb-setting-card" :class="settingShow ? 'open' : 'close'">
                <div class="wb-setting-line">
                    <div class="wb-setting-label">粗细</div>
                    <div class="wb-setting-value">
                        <Step
                            :inputValue="lineWidth"
                            @reduce="reduce"
                            @add="add"
                            @input="input"
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
import { defineEmits, defineProps, ref, toRefs } from "vue";
import Mouse from "../icons/mouse.vue";
import Pen from "../icons/pen.vue";
import Setting from "../icons/setting.vue";
import Step from "./step.vue";
import { OPTION_TYPE } from "../config";

const emit = defineEmits(["updateOptionType", "updateLineWidth"]);

const props = defineProps({
    optionType: {
        type: String,
        default: OPTION_TYPE.MOUSE
    }
});

const { optionType } = toRefs(props);

const settingShow = ref(true);

const selectedMode = (type: string) => {
    emit("updateOptionType", type);
};

const lineWidth = ref(5);
const reduce = () => {
    if (lineWidth.value === 1) return;
    if (lineWidth.value === 5) {
        lineWidth.value = 1;
    } else {
        lineWidth.value -= 5;
    }
    emit("updateLineWidth", lineWidth.value);
};

const add = () => {
    if (lineWidth.value === 1) {
        lineWidth.value = 5;
    } else {
        lineWidth.value += 5;
    }
    emit("updateLineWidth", lineWidth.value);
};

const input = (value: number) => {
    lineWidth.value = value;
    emit("updateLineWidth", lineWidth.value);
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

.wb-tool svg {
    height: 15px;
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
    transform: rotate(180deg);
}

.wb-setting-btn svg {
    height: 20px;
    transition: 0.3s all ease;
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
