import "jsdom-global/register";

import Matrix from "../src/matrix";
import Manifest from "../src/manifest";
import Axis from "../src/axis";

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
            let manifest = new Manifest(`
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
            `);

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
            let manifest = new Manifest(`
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
                                <Increment>2</Increment>
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
            `);

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
            let manifest = new Manifest(`
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
                                <Increment>2</Increment>
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
            `);

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

        it("Should return a single value if the z parameter is specified", () => {
            let manifest = new Manifest(`
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
                                <Increment>2</Increment>
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
            `);

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
});
