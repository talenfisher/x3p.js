import { readFileSync as read } from "fs";
import { resolve } from "path";

import Manifest from "../src/manifest";

declare var window: any;
const DOCTYPE = '<?xml version="1.0" encoding="UTF-8"?>';
const Parser = new window.DOMParser();
const parse = (value: string) => Parser.parseFromString(value, "text/xml");

describe("Manifest", () => {

    describe("constructor", () => {
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
    });

    describe("get", () => {
        it("Should convert elements with values that are numbers into numbers", () => {
            let source = DOCTYPE + `<root><Record3><MatrixDimension><SizeX>3</SizeX></MatrixDimension></Record3></root>`;
            let manifest = new Manifest(source);
    
            expect(manifest.get("Record3 MatrixDimension SizeX")).toBe(3);
        });

        it("Should return undefined if the node's value does not exist", () => {
            let source = DOCTYPE + `<root></root>`;
            let manifest = new Manifest(source);

            expect(manifest.get("Record1 MatrixDimension SizeX")).toBe(undefined);
        });
    });

    describe("getNode", () => {
        it("Should return a node when it exists", () => {
            let source = DOCTYPE + `<root><Record1><Revision>CSAFE-X3P</Revision></Record1></root>`;
            let manifest = new Manifest(source);

            expect(manifest.getNode("Record1 Revision")).toBeInstanceOf(Node);
        });

        it("Should return a node with a corresponding value from the manifest", () => {
            let source = DOCTYPE + `<root><Record1><Revision>CSAFE-X3P</Revision></Record1></root>`;
            let manifest = new Manifest(source);

            expect(manifest.getNode("Record1 Revision").innerHTML).toBe("CSAFE-X3P");
        });
    });

    describe("set", () => {
        it("Should update a node's value", () => {
            let source = DOCTYPE + `<root><Record1><Revision>Test</Revision></Record1></root>`;
            let manifest = new Manifest(source);
            manifest.set("Record1 Revision", "CSAFE-X3P");

            expect(manifest.get("Record1 Revision")).toBe("CSAFE-X3P");
        });

        it("Should create a new node if it doesn't exist", () => {
            let source = DOCTYPE + `<root></root>`;
            let manifest = new Manifest(source);
            manifest.set("Record5 FunElement", "Party");

            expect(manifest.get("Record5 FunElement")).toBe("Party");
        });
    });

    describe("has", () => {
        it("Should return true if the selector resolves to a node in the manifest", () => {
            let source = DOCTYPE + `<root><Record1><Revision>Test</Revision></Record1></root>`;
            let manifest = new Manifest(source);
            
            expect(manifest.has("Record1 Revision")).toBe(true);
        });

        it("Should return false if the selector does not resolve to a node in the manifest", () => {
            let source = DOCTYPE + `<root></root>`;
            let manifest = new Manifest(source);
            
            expect(manifest.has("Record5 FunElement")).toBe(false);
        });
    });

    describe("remove", () => {
        it("Should remove an element from the manifest", () => {
            let source = DOCTYPE + `<root><Record1></Record1></root>`;
            let manifest = new Manifest(source);

            manifest.remove("Record1");
            expect(manifest.has("Record1")).toBe(false);
        });
    });

    describe("toString", () => {
        it("Should serialize the manifest into an XML string that is compliant with ISO5436", () => {
            let expects = read(resolve(__dirname, "expects/manifest.toString.1.xml"), { encoding: "utf-8" });
            let source = DOCTYPE + `<root><Record1><Revision>CSAFE-X3P</Revision></Record1></root>`;
            let manifest = new Manifest(source);

            expect(manifest.toString()).toBe(expects);
        });
    });

    describe("get checksum", () => {
        it("Should return the md5 checksum of the manifest", () => {
            let manifest = new Manifest(`<root></root>`);
            expect(manifest.checksum).toBe("cfc3ed722019bb5647f7715f720b9f02");
        });
    });
});
