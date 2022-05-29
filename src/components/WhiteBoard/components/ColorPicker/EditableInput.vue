<template>
    <div class="editable-input">
        <input
            class="input-content"
            :value="val"
            @input="($event) => handleInput($event as InputEvent)"
        />
    </div>
    <div class="editable-input rgba-input">
        <input
            class="input-content"
            :value="rgbVal"
            @input="($event) => handleRGBAInput($event as InputEvent)"
        />
    </div>
</template>

<script setup lang="ts">
import { computed, defineEmits, defineProps, PropType } from "vue";
import tinycolor, { ColorFormats } from "tinycolor2";

const emit = defineEmits(["colorChange"]);

const props = defineProps({
    value: {
        type: Object as PropType<ColorFormats.RGBA>,
        required: true
    }
});

const val = computed(() => {
    let _hex = "";
    if (props.value.a < 1) {
        _hex = tinycolor(props.value).toHex8String().toUpperCase();
    } else {
        _hex = tinycolor(props.value).toHexString().toUpperCase();
    }
    return _hex.replace("#", "");
});

const rgbVal = computed(() => {
    return tinycolor(props.value).toRgbString();
});

const rgbExp = new RegExp(
    "^[rR][gG][Bb][(]([\\s]*(2[0-4][0-9]|25[0-5]|[01]?[0-9][0-9]?)[\\s]*,){2}[\\s]*(2[0-4]\\d|25[0-5]|[01]?\\d\\d?)[\\s]*[)]{1}$"
);

const rgbaExp = new RegExp(
    "^[rR][gG][Bb][Aa][(]([\\s]*(2[0-4][0-9]|25[0-5]|[01]?[0-9][0-9]?)[\\s]*,){3}[\\s]*(1|1.0|0|0.[0-9])[\\s]*[)]{1}$"
);

const handleRGBAInput = (e: InputEvent) => {
    const value = (e.target as HTMLInputElement).value;
    if (value.indexOf("rgb") > -1) {
        const rgba = value.replace(/\s*/g, "");
        const rgbaArr = rgba.match(/[.\d]+/g);
        if (
            rgbaArr &&
            ((rgbaArr.length === 3 && rgba.match(rgbExp) !== null) ||
                (rgbaArr.length === 4 && rgba.match(rgbaExp) !== null))
        ) {
            emit("colorChange", {
                r: Number(rgbaArr[0]),
                g: Number(rgbaArr[1]),
                b: Number(rgbaArr[2]),
                a: rgbaArr[3] ? Number(rgbaArr[3]) : 1
            });
        }
    }
};

const handleInput = (e: InputEvent) => {
    const value = (e.target as HTMLInputElement).value;
    if (value.length >= 6) {
        emit("colorChange", tinycolor(value).toRgb());
    }
};
</script>

<style scoped>
.editable-input {
    width: 100%;
    position: relative;
    overflow: hidden;
    text-align: center;
    font-size: 14px;
}

.editable-input:after {
    content: "#";
    position: absolute;
    left: 0;
    top: 50%;
    transform: translateY(-50%);
    color: #999;
}

.rgba-input:after {
    content: "rgba";
}

.input-content {
    width: 100%;
    padding: 3px;
    border: 0;
    border-bottom: 1px solid #ddd;
    outline: none;
    text-align: center;
}

.input-label {
    text-transform: capitalize;
}
</style>
