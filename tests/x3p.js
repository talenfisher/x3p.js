/* global it, describe */
const assert = require("assert");
const X3PJs = require("../bin/x3p");
const X3P = X3PJs.default;

describe("X3P", () => {
    describe("constructor", () => {
        it("should create new X3P file when file parameter is not specified", () => {
            let x3p = new X3P();
            assert.equal("main.xml" in x3p.container.files, true);
            assert.equal("bindata/data.bin" in x3p.container.files, true);
            assert.equal("md5checksum.hex" in x3p.container.files, true);
        });
    });

    describe("_checkOutputSupport", () => {
        it("should detect support for nodebuffer in test environment", () => {
            let x3p = new X3P();
            assert.equal(x3p._outputType, "nodebuffer");
        });
    });

    describe("_checkRoot", () => {
        it("should detect no root folder when creating blank X3Ps", () => {
            let x3p = new X3P();
            assert.equal(x3p._root, "");
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
            assert.equal(await x3p.readFile("main.xml"), X3PJs.DEFAULTS["main.xml"]);
        });
    });

    describe("toBlob", () => {
        it("should return a promise that resolves to a node buffer", async () => {
            let x3p = new X3P();
            let blob = await x3p.toBlob();
            assert.equal(blob.constructor.name, "Buffer");
        });
    });
});