import "jsdom-global/register";

import Matrix from "../src/matrix";
import Manifest from "../src/manifest";
import Axis from "../src/axis";

const MANIFEST_SRC = `
<root>
    <Record1>
        <Axes>
            <CX>
                <AxisType>I</AxisType>
                <DataType>D</DataType>
                <Increment>0.5</Increment>
                <Offset>0</Offset>
            </CX>
            <CY>
                <AxisType>I</AxisType>
                <DataType>D</DataType>
                <Increment>1</Increment>
                <Offset>0</Offset>
            </CY>
            <CZ>
                <AxisType>A</AxisType>
                <DataType>D</DataType>
                <Increment>1</Increment>
                <Offset>0</Offset>
            </CZ>
        </Axes>
    </Record1>
    <Record3>
        <MatrixDimension>
            <SizeX>3</SizeX>
            <SizeY>3</SizeY>
            <SizeZ>1</SizeZ>
        </MatrixDimension>
    </Record3>
</root>
`;

function createArrayBuffer(array: number[]) {
    let buffer = new ArrayBuffer(array.length * 16);
    let view = new DataView(buffer);
    
    for(let i = 0; i < array.length; i++) {
        view.setFloat64(i * 8, array[i]);
    }

    return buffer;
}

describe("Matrix", () => {
    describe("get", () => {
        it("Index 0 in the returned array should be an increment adjusted x-value", () => {
            let manifest = new Manifest(MANIFEST_SRC);

            let axes = {
                x: new Axis({ name: "X", manifest }),
                y: new Axis({ name: "Y", manifest }),
                z: new Axis({ name: "Z", manifest }),
            };

            let pointBuffer = createArrayBuffer([ 2, 3, 5, 2, 6, 9, 2, 9, 3 ]);
            let matrix = new Matrix({ axes, manifest, pointBuffer });

            // @ts-ignore
            expect(matrix.get(1, 0)[0]).toBe(0.5);
        });

        it("Index 1 in the returned array should be an increment adjusted y-value", () => {
            let manifest = new Manifest(MANIFEST_SRC);
            manifest.set("Record1 Axes CY Increment", 2);

            let axes = {
                x: new Axis({ name: "X", manifest }),
                y: new Axis({ name: "Y", manifest }),
                z: new Axis({ name: "Z", manifest }),
            };

            let pointBuffer = createArrayBuffer([ 2, 3, 5, 2, 6, 9, 2, 9, 3 ]);
            let matrix = new Matrix({ axes, manifest, pointBuffer });

            // @ts-ignore
            expect(matrix.get(0, 1)[1]).toBe(2);
        });

        it("Index 2 in the returned array should be the z-value/value in the matrix", () => {
            let manifest = new Manifest(MANIFEST_SRC);

            let axes = {
                x: new Axis({ name: "X", manifest }),
                y: new Axis({ name: "Y", manifest }),
                z: new Axis({ name: "Z", manifest }),
            };

            let pointBuffer = createArrayBuffer([ 2, 3, 5, 2, 6, 9, 2, 9, 3 ]);
            let matrix = new Matrix({ axes, manifest, pointBuffer });

            // @ts-ignore
            expect(matrix.get(0, 1)[2]).toBe(3);
        });

        it("Should return a single value if the axis parameter is specified", () => {
            let manifest = new Manifest(MANIFEST_SRC);

            let axes = {
                x: new Axis({ name: "X", manifest }),
                y: new Axis({ name: "Y", manifest }),
                z: new Axis({ name: "Z", manifest }),
            };

            let pointBuffer = createArrayBuffer([ 2, 3, 5, 2, 6, 9, 2, 9, 3 ]);
            let matrix = new Matrix({ axes, manifest, pointBuffer });

            expect(matrix.get(0, 1, 2)).toBe(3);
        });
    });

    describe("getCDiff", () => {
        it("Should return the central difference quotient with respect to both x and y", () => {
            let manifest = new Manifest(MANIFEST_SRC);
            manifest.set("Record1 Axes CX Increment", 1);
            manifest.set("Record1 Axes CY Increment", 2);

            let axes = {
                x: new Axis({ name: "X", manifest }),
                y: new Axis({ name: "Y", manifest }),
                z: new Axis({ name: "Z", manifest }),
            };

            let pointBuffer = createArrayBuffer([ 2, 3, 5, 2, 6, 9, 2, 9, 3 ]);
            let matrix = new Matrix({ axes, manifest, pointBuffer });
            let cDiff = matrix.getCDiff(1, 1, 0);
            
            expect(cDiff[0]).toBe(1);
            expect(cDiff[1]).toBe(0);
        });

        it("Should return 0 on edge cases", () => {
            let manifest = new Manifest(MANIFEST_SRC);
            manifest.set("Record1 Axes CX Increment", 2);
            manifest.set("Record1 Axes CY Increment", 2);

            let axes = {
                x: new Axis({ name: "X", manifest }),
                y: new Axis({ name: "Y", manifest }),
                z: new Axis({ name: "Z", manifest }),
            };

            let pointBuffer = createArrayBuffer([ 2, 3, 5, 2, 6, 9, 2, 9, 3 ]);
            let matrix = new Matrix({ axes, manifest, pointBuffer });
            let cdiff = matrix.getCDiff(0, 0, 2);

            expect(cdiff[0]).toBe(0);
            expect(cdiff[1]).toBe(0);
        });

        it("Dx should be 0 when the upper element is NaN", () => {
            let manifest = new Manifest(MANIFEST_SRC);

            let axes = {
                x: new Axis({ name: "X", manifest }),
                y: new Axis({ name: "Y", manifest }),
                z: new Axis({ name: "Z", manifest }),
            };

            let pointBuffer = createArrayBuffer([ 2, NaN, 5, 2, 6, 9, 2, 9, 3 ]);
            let matrix = new Matrix({ axes, manifest, pointBuffer });
            let cdiff = matrix.getCDiff(1, 1, 2);

            expect(cdiff[0]).toBe(0);
        });

        it("Dx should be 0 when the lower element is NaN", () => {
            let manifest = new Manifest(MANIFEST_SRC);

            let axes = {
                x: new Axis({ name: "X", manifest }),
                y: new Axis({ name: "Y", manifest }),
                z: new Axis({ name: "Z", manifest }),
            };

            let pointBuffer = createArrayBuffer([ 2, 3, 5, 2, 6, 9, 2, NaN, 3 ]);
            let matrix = new Matrix({ axes, manifest, pointBuffer });
            let cdiff = matrix.getCDiff(1, 1, 2);

            expect(cdiff[0]).toBe(0);
        });

        it("Dy should be 0 when the left element is NaN", () => {
            let manifest = new Manifest(MANIFEST_SRC);
            let axes = {
                x: new Axis({ name: "X", manifest }),
                y: new Axis({ name: "Y", manifest }),
                z: new Axis({ name: "Z", manifest }),
            };

            let pointBuffer = createArrayBuffer([ NaN, 3, 5, 2, 6, 9, 2, 8, 3 ]);
            let matrix = new Matrix({ axes, manifest, pointBuffer });
            let cdiff = matrix.getCDiff(0, 1, 2);
            
            expect(cdiff[1]).toBe(0);
        });

        it("Dy should be 0 when the right element is NaN", () => {
            let manifest = new Manifest(MANIFEST_SRC);
            let axes = {
                x: new Axis({ name: "X", manifest }),
                y: new Axis({ name: "Y", manifest }),
                z: new Axis({ name: "Z", manifest }),
            };

            let pointBuffer = createArrayBuffer([ 2, 3, NaN, 2, 6, 9, 2, 8, 3 ]);
            let matrix = new Matrix({ axes, manifest, pointBuffer });
            let cdiff = matrix.getCDiff(0, 1, 2);

            expect(cdiff[1]).toBe(0);
        });
    });

    describe("get max", () => {
        it("Should return the maximum z value in the matrix", () => {
            let manifest = new Manifest(MANIFEST_SRC);
            let axes = {
                x: new Axis({ name: "X", manifest }),
                y: new Axis({ name: "Y", manifest }),
                z: new Axis({ name: "Z", manifest }),
            };

            let pointBuffer = createArrayBuffer([ 2, 3, 8, 2, 6, 3, 2, 8, 2 ]);
            let matrix = new Matrix({ axes, manifest, pointBuffer });
            
            expect(matrix.max).toBe(8);
        });
    });

    describe("get min", () => {
        it("Should return the minimum z value in the matrix", () => {
            let manifest = new Manifest(MANIFEST_SRC);
            let axes = {
                x: new Axis({ name: "X", manifest }),
                y: new Axis({ name: "Y", manifest }),
                z: new Axis({ name: "Z", manifest }),
            };

            let pointBuffer = createArrayBuffer([ 2, 3, 8, 2, 6, 1, 2, 8, 2 ]);
            let matrix = new Matrix({ axes, manifest, pointBuffer });

            expect(matrix.min).toBe(1);
        });
    });

    describe("get size", () => {
        it("Should return the element size in the matrix", () => {
            let manifest = new Manifest(MANIFEST_SRC);
            let axes = {
                x: new Axis({ name: "X", manifest }),
                y: new Axis({ name: "Y", manifest }),
                z: new Axis({ name: "Z", manifest }),
            };

            let pointBuffer = createArrayBuffer([ 2, 3, 8, 2, 6, 1, 2, 8, 2 ]);
            let matrix = new Matrix({ axes, manifest, pointBuffer });

            expect(matrix.size).toBe(9);
        });
    });
});
