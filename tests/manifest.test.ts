import "jsdom-global/register";

import Manifest from "../src/manifest";

declare var window: any;
const DOCTYPE = '<?xml version="1.0" encoding="UTF-8"?>';
const Parser = new window.DOMParser();
const parse = (value: string) => Parser.parseFromString(value, "text/xml");

describe("Manifest", () => {
    it("Should merge single records into the resulting tree", () => {
        let source = DOCTYPE + `<root><Record1><Revision>Test</Revision></Record1></root>`;
        let manifest = new Manifest(source);
        expect(manifest.get("Record1 Revision")).toBe("Test");
    });

    it("Should merge multiple records into the resulting tree", () => {
        let source = DOCTYPE + `<root><Record1><Revision>Test</Revision></Record1><Record2><Creator>Talen</Creator></Record2></root>`;
        let manifest = new Manifest(source);
        
        expect(manifest.get("Record1 Revision")).toBe("Test");
        expect(manifest.get("Record2 Creator")).toBe("Talen");
    });

    it("Should add records that don't exist in the standard to the tree", () => {
        let source = DOCTYPE + `<root><Record5><FunElement>Party</FunElement></Record5></root>`;
        let manifest = new Manifest(source);

        expect(manifest.get("Record5 FunElement")).toBe("Party");
    });

    it("Should convert elements with values that are numbers into numbers", () => {
        let source = DOCTYPE + `<root><Record3><MatrixDimension><SizeX>3</SizeX></MatrixDimension></Record3></root>`;
        let manifest = new Manifest(source);

        expect(manifest.get("Record3 MatrixDimension SizeX")).toBe(3);
    });
});