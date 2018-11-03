/* global it, describe */
const fs = require("fs");
const path = require("path");
const assert = require("chai").assert;
const X3PJs = require("../bin/x3p");
const X3P = X3PJs.default;
const ElementTree = require("elementtree");

const CSAFE_LOGO_PATH = path.resolve(__dirname, "artifacts/csafe-logo.x3p");

describe("X3P", () => {
    describe("constructor", () => {
        it("should create new X3P file when file parameter is not specified", () => {
            let x3p = new X3P();
            assert.isOk("main.xml" in x3p.container.files);
            assert.isOk("bindata/data.bin" in x3p.container.files);
            assert.isOk("md5checksum.hex" in x3p.container.files);
        });
    });

    describe("_checkOutputSupport", () => {
        it("should detect support for nodebuffer in test environment", () => {
            let x3p = new X3P();
            assert.strictEqual(x3p._outputType, "nodebuffer");
        });
    });

    describe("_checkRoot", () => {
        it("should detect no root folder when creating blank X3Ps", () => {
            let x3p = new X3P();
            assert.strictEqual(x3p._root, "");
        });

        it("should detect a root folder when there is one", () => {
            let file = fs.readFileSync(path.resolve(__dirname, "artifacts/csafe-logo.x3p"));
            let x3p = new X3P(file);
            x3p.on("load", () => assert.strictEqual(x3p._root, "csafe-logo/"));
        });
    });

    describe("get fileNames", () => {
        it("blank X3Ps should have main.xml, bindata/, bindata/data.bin, and md5checksum.hex", () => {
            let x3p = new X3P();
            assert.deepStrictEqual(x3p.fileNames, [
                "main.xml",
                "bindata/",
                "bindata/data.bin",
                "md5checksum.hex"
            ]);
        });
    });
    
    describe("readFile", () => {
        it("should return default value for main.xml after blank X3P creation", async () => {
            let x3p = new X3P();
            assert.strictEqual(await x3p.readFile("main.xml"), X3PJs.DEFAULTS["main.xml"]);
        });

        it("should return default value for md5checksum.hex after blank X3P creation", async () => {
            let x3p = new X3P();
            assert.strictEqual(await x3p.readFile("md5checksum.hex"), X3PJs.DEFAULTS["md5checksum.hex"]);
        });

        it("should return default value for bindata/data.bin after blank X3P creation", async () => {
            let x3p = new X3P();
            assert.strictEqual(await x3p.readFile("bindata/data.bin"), X3PJs.DEFAULTS["bindata/data.bin"]);
        });

        it("[csafe-logo.x3p @ main.xml] should return an xml string which contains Record1 ", () => {
            let file = fs.readFileSync(CSAFE_LOGO_PATH);
            let x3p = new X3P(file);

            x3p.on("load", async () => {
                let manifest = await x3p.readFile("main.xml");
                let document = ElementTree.parse(manifest);
                assert.isOk(document.find("./Record1") !== null);
            });
        });
    });

    describe("toBlob", () => {
        it("should return a promise that resolves to a node buffer", async () => {
            let x3p = new X3P();
            let blob = await x3p.toBlob();
            assert.strictEqual(typeof blob, "object");
        });
    });
});