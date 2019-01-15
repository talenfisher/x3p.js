import { bufferToTypedArray } from "../src/data-types";

describe("data-types", () => {
    describe("bufferToTypedArray", () => {
        it("Should transform a buffer to a Float64Array if type=Float64", () => {
            let buffer = new ArrayBuffer(8);
            let arr = bufferToTypedArray(buffer, "Float64");
            expect(arr).toBeInstanceOf(Float64Array);
        });

        it("Should transform a buffer to a Float32Array if type=Float32", () => {
            let buffer = new ArrayBuffer(8);
            let arr = bufferToTypedArray(buffer, "Float32");
            expect(arr).toBeInstanceOf(Float32Array);
        });

        it("Should transform a buffer to an Int32Array if type=Int32", () => {
            let buffer = new ArrayBuffer(8);
            let arr = bufferToTypedArray(buffer, "Int32");
            expect(arr).toBeInstanceOf(Int32Array);
        });

        it("Should transform a buffer to an Int16Array if type=Int16", () => {
            let buffer = new ArrayBuffer(8);
            let arr = bufferToTypedArray(buffer, "Int16");
            expect(arr).toBeInstanceOf(Int16Array);
        });
    });
});
