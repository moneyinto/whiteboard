<template>
    <div class="wb-step">
        <div class="wb-step-btn" @click="reduce()">
            <Reduce />
        </div>
        <input v-if="!disabled" :value="inputValue" type="number" min="1" @input="event => stepValueInput(event)" class="wb-step-value" />
        <div v-else class="web-step-value-readonly">{{ inputValue }}</div>
        <div class="wb-step-btn" @click="add()">
            <Plus />
        </div>
    </div>
</template>

<script setup lang="ts">
import { defineProps, toRefs, defineEmits } from "vue";
import Plus from "../icons/Plus.vue";
import Reduce from "../icons/Reduce.vue";
const props = defineProps({
    inputValue: {
        type: [String, Number],
        default: 0
    },
    disabled: {
        type: Boolean,
        default: false
    }
});

const { inputValue, disabled } = toRefs(props);

const emit = defineEmits(["reduce", "add", "input"]);

const reduce = () => emit("reduce");
const add = () => emit("add");
const stepValueInput = (event: InputEvent) => {
    const value = Number((event.target as HTMLInputElement).value);
    // 限制必须大于等于1
    if (value < 1) (event.target as HTMLInputElement).value = "1";
    emit("input", value < 1 ? 1 : value);
};
</script>

<style scoped>
.wb-step {
    display: flex;
    align-items: center;
}

.wb-step-btn {
    width: 30px;
    height: 30px;
    border-radius: 5px;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #e9ecef;
    cursor: pointer;
}

.wb-step-btn svg {
    height: 12px;
}

.wb-step-value {
    margin: 0 5px;
    width: 40px !important;
    width: auto;
    text-align: center;
    font-size: 14px;
    line-height: 30px;
    border: none;
    outline: none;
    -moz-appearance: textfield;
}

.web-step-value-readonly {
    margin: 0 5px;
    min-width: 40px;
    text-align: center;
    font-size: 14px;
    line-height: 30px;
}

.wb-step-value::-webkit-outer-spin-button,
.wb-step-value::-webkit-inner-spin-button {
  -webkit-appearance: none;
}
</style>
