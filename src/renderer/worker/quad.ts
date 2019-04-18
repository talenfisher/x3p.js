export default function createQuad(stride: number = 1) {
    return [
        [0,         0],
        [0,         stride],
        [stride,    0],
        [stride,    stride],
        [stride,    0],
        [0,         stride],
    ];
}
