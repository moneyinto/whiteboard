<template>
    <div class="wb-color-picker">
        <div
            class="wb-color-item"
            :style="{ backgroundColor: color }"
            v-for="color in customColors"
            :key="color"
            @click="selectedColor(color)"
        >
            <Tick v-if="inputValue === color" />
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, defineProps, defineEmits, toRefs } from "vue";
import Tick from "../icons/tick.vue";
const props = defineProps({
    inputValue: {
        type: String,
        required: true
    }
});
const { inputValue } = toRefs(props);
const customColors = ref([
    "#000000",
    "#f60000",
    "#fff700",
    "#0014ff",
    "#00ff66"
]);

const emit = defineEmits(["update"]);
const selectedColor = (color: string) => {
    emit("update", color);
}
</script>

<style scoped>
.wb-color-picker {
    display: flex;
    align-items: center;
}

.wb-color-item {
    width: 25px;
    height: 25px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 5px;
    margin-right: 5px;
    cursor: pointer;
}

.wb-color-item svg {
    width: 15px;
    fill: #ffffff;
    color: #ffffff;
}
</style>
