import "jsdom-global/register";

import Mask from "../src/mask";
import Manifest from "../src/manifest";

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
            let manifest = new Manifest(`<root></root>`);
            let definition = parse(`
                <Mask>
                    <Annotations>
                        <Annotation color='red'>Example Label</Annotation>
                    </Annotations>
                </Mask>
            `).documentElement as Element;

            let mask = new Mask({ manifest, definition });
            expect(mask.annotations.red).toBe("Example Label");
        });
    });

    describe("set annotations", () => {
        it("Should update an existing annotation", () => {
            let manifest = new Manifest(`<root></root>`);
            let definition = parse(`
                <Mask>
                    <Annotations>
                        <Annotation color='red'>Example Label</Annotation>
                    </Annotations>
                </Mask>
            `).documentElement as Element;

            let mask = new Mask({ manifest, definition });
            
            mask.annotations.red = "Example 2";
            expect(mask.annotations.red).toBe("Example 2");
        });

        it("Should create a new annotation if it doesn't already exist", () => {
            let manifest = new Manifest(`<root></root>`);
            let mask = new Mask({ manifest });

            mask.annotations.red = "Example Label";
            expect(mask.annotations.red).toBe("Example Label");
        });
    });
});
