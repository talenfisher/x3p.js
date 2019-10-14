import Manifest from "../src/manifest";
import Mask from "../src/mask";

declare var window: any;

const Parser = new window.DOMParser();
const parse = (value: string) => Parser.parseFromString(value, "application/xml");

describe("Mask", () => {
    describe("get height", () => {
        it("Should return the value of SizeY in the manifest", () => {
            let manifest = new Manifest(`
                <root>
                    <Record3>
                        <MatrixDimension>
                            <SizeY>3</SizeY>
                        </MatrixDimension>
                    </Record3>
                </root>
            `);
            
            let mask = new Mask({ manifest });
            expect(mask.height).toBe(3);
        });

        it("Should return 0 if SizeY is not in the manifest", () => {
            let manifest = new Manifest(`<root></root>`);
            let mask = new Mask({ manifest });

            expect(mask.height).toBe(0);
        });
    });

    describe("get width", () => {
        it("Should return the value of SizeX in the manifest", () => {
            let manifest = new Manifest(`
                <root>
                    <Record3>
                        <MatrixDimension>
                            <SizeX>3</SizeX>
                        </MatrixDimension>
                    </Record3>
                </root>
            `);

            let mask = new Mask({ manifest });
            expect(mask.width).toBe(3);
        });

        it("Should return 0 when SizeX is not in the manifest", () => {
            let manifest = new Manifest(`<root></root>`);
            let mask = new Mask({ manifest });
            expect(mask.width).toBe(0);
        });
    });

    describe("get annotations", () => {
        it("Should return undefined on an annotation that doesn't exist", () => {
            let manifest = new Manifest(`<root></root>`);
            let mask = new Mask({ manifest });
            expect(mask.annotations.red).toBe(undefined);
        });

        it("Should return the annotation value when it exists in the Mask definition", () => {
            let manifest = new Manifest(`
                <root>
                    <Record3>
                        <Mask>
                            <Annotations>
                                <Annotation color="red">Example Label</Annotation>
                            </Annotations>
                        </Mask>
                    </Record3>
                </root>
            `);

            let mask = new Mask({ manifest });
            expect(mask.annotations.red).toBe("Example Label");
        });
    });

    describe("set annotations", () => {
        it("Should update an existing annotation", () => {
            let manifest = new Manifest(`
                <root>
                    <Record3>
                        <Mask>
                            <Annotations>
                                <Annotation color="red">Example Label</Annotation>
                            </Annotations>
                        </Mask>
                    </Record3>
                </root>
            `);

            let mask = new Mask({ manifest });
            
            mask.annotations.red = "Example 2";
            expect(mask.annotations.red).toBe("Example 2");
        });

        it("Should create a new annotation if it doesn't already exist", () => {
            let manifest = new Manifest(`<root></root>`);
            let mask = new Mask({ manifest });

            mask.annotations.red = "Example Label";
            expect(mask.annotations.red).toBe("Example Label");
        });

        it("Should retain older annotations", () => {
            let manifest = new Manifest(`
                <root>
                    <Record3>
                        <Mask>
                            <Annotations>
                                <Annotation color="red">Red Annotation</Annotation>
                            </Annotations>
                        </Mask>
                    </Record3>
                </root>
            `);

            let mask = new Mask({ manifest });
            mask.annotations.blue = "Blue Annotation";
            expect(mask.annotations.red).toBe("Red Annotation");
        });
    });

    describe("isValidMask", () => {
        it("Should return false if the specified mask is not valid XML", () => {
            expect(Mask.isValidMask("This ain't XML")).toBe(false);
        });

        it("Should return false if there is no background element", () => {
            expect(Mask.isValidMask("<Mask><Annotations /></Mask>")).toBe(false);
        });

        it("Should return false if the background element is empty", () => {
            expect(Mask.isValidMask("<Mask><Background /><Annotations /></Mask>")).toBe(false);
        });

        it("Should return false if there is no annotation element", () => {
            expect(Mask.isValidMask("<Mask><Background>#000000</Background></Mask>")).toBe(false);
        });

        it("Should return false if the root element is not a Mask element", () => {
            expect(Mask.isValidMask("<NotMask><Background>#0000000</Background><Annotations/></NotMask>")).toBe(false);
        });

        it("Should return true if the mask is valid", () => {
            expect(Mask.isValidMask("<Mask><Background>#000000</Background><Annotations/></Mask>")).toBe(true);
        });
    });
});
