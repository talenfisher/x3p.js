import Axis from "../src/axis";
import Manifest from "../src/manifest";

describe("Axis", () => {
    describe("constructor", () => {
        it("Should throw an error when the axis is not defined in the manifest's Record1", () => {
            let manifest = new Manifest(`<root></root>`);
            manifest.remove("Record1 Axes CX");
            expect(() => new Axis({ name: "X", manifest })).toThrow("Axis 'X' is not defined in the manifest");
        });
    });

    describe("get increment", () => {
        it("Should return the axis increment when present in the manifest", () => {
            let manifest = new Manifest(`
                <root>
                    <Record1>
                        <Axes>
                            <CX>
                                <Increment>5</Increment>
                            </CX>
                        </Axes>
                    </Record1>
                </root>
            `);

            let axis = new Axis({ name: "X", manifest });
            expect(axis.increment).toBe(5);
        });

        it("Should return 0 when there is no increment in the manifest", () => {
            let manifest = new Manifest(`<root></root>`);

            let axis = new Axis({ name: "X", manifest });
            expect(axis.increment).toBe(0);
        });
    });

    describe("get dataType", () => {
        it("Should return Float64 if manifest definition is D", () => {
            let manifest = new Manifest(`
                <root>
                    <Record1>
                        <Axes>
                            <CX>
                                <DataType>D</DataType>
                            </CX>
                        </Axes>
                    </Record1>
                </root>
            `);

            let axis = new Axis({ name: "X", manifest });
            expect(axis.dataType.name).toBe("Float64");
        });

        it("Should return Float32 if manifest definition is F", () => {
            let manifest = new Manifest(`
                <root>
                    <Record1>
                        <Axes>
                            <CX>
                                <DataType>F</DataType>
                            </CX>
                        </Axes>
                    </Record1>
                </root>
            `);

            let axis = new Axis({ name: "X", manifest });
            expect(axis.dataType.name).toBe("Float32");
        });

        it("Should return Int32 if manifest definition is L", () => {
            let manifest = new Manifest(`
                <root>
                    <Record1>
                        <Axes>
                            <CX>
                                <DataType>L</DataType>
                            </CX>
                        </Axes>
                    </Record1>
                </root>
            `);

            let axis = new Axis({ name: "X", manifest });
            expect(axis.dataType.name).toBe("Int32");
        });

        it("Should return Int16 if manifest definition is I", () => {
            let manifest = new Manifest(`
                <root>
                    <Record1>
                        <Axes>
                            <CX>
                                <DataType>I</DataType>
                            </CX>
                        </Axes>
                    </Record1>
                </root>
            `);

            let axis = new Axis({ name: "X", manifest });
            expect(axis.dataType.name).toBe("Int16");
        });

        it("Should throw an error if the definition's data type is invalid", () => {
            let manifest = new Manifest(`
                <root>
                    <Record1>
                        <Axes>
                            <CX>
                                <DataType>a</DataType>
                            </CX>
                        </Axes>
                    </Record1>
                </root>
            `);

            let axis = new Axis({ name: "X", manifest });
            expect(() => axis.dataType.name).toThrow("'a' is not a valid data type");
        });

        it("Should throw an error if the definition's data type is not present", () => {
            let manifest = new Manifest(`
                <root>
                    <Record1>
                        <Axes>
                            <CX>
                            </CX>
                        </Axes>
                    </Record1>
                </root>
            `);

            let axis = new Axis({ name: "X", manifest });
            expect(() => axis.dataType.name).toThrow("'null' is not a valid data type");
        });
    });

    describe("get size", () => {
        it("Should return the size when present in the manifest", () => {
            let manifest = new Manifest(`
                <root>
                    <Record1><Axes><CX></CX></Axes></Record1>
                    <Record3>
                        <MatrixDimension>
                            <SizeX>5</SizeX>
                        </MatrixDimension>
                    </Record3>
                </root>
            `);

            let axis = new Axis({ name: "X", manifest });
            expect(axis.size).toBe(5);
        });

        it("Should return 0 when the size isn't specified in the manifest", () => {
            let manifest = new Manifest(`
                <root>
                    <Record1><Axes><CX></CX></Axes></Record1>
                </root>
            `);

            let axis = new Axis({ name: "X", manifest });
            expect(axis.size).toBe(0);
        });
    });
});
