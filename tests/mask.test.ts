import Mask from "../src/mask";
import { parse } from "elementtree";

describe("Mask", () => {
    describe("get height", () => {
        it("Should return the value of SizeY in the manifest", () => {
            let manifest = parse(`
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
            let manifest = parse(`<root></root>`);
            let mask = new Mask({ manifest });

            expect(mask.height).toBe(0);
        });
    });

    describe("get width", () => {
        it("Should return the value of SizeX in the manifest", () => {
            let manifest = parse(`
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
            let manifest = parse(`<root></root>`);
            let mask = new Mask({ manifest });
            expect(mask.width).toBe(0);
        });
    });
});