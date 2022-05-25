import { Ref } from "vue";

export default (canvas: Ref) => {
    const handleDown = (event: MouseEvent) => {
        console.log(event);
    };

    const handleMove = (event: MouseEvent) => {
        console.log(event);
    };

    const handleUp = (event: MouseEvent) => {
        console.log(event);
    };

    return {
        handleDown,
        handleMove,
        handleUp
    }
}