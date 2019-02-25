declare module "@talenfisher/dtype" {
    export default function dtype(type: string): Int8Array | Int16Array | Int32Array | Uint8Array | Uint16Array | Uint32Array | Float32Array | Float64Array | Array<any> | Uint8ClampedArray | undefined;
}