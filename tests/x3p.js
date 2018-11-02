const assert = require("assert");
const X3P = require("../bin/x3p");

describe("X3P", () => {
    describe("constructor", () => {
        it("should create new X3P file when file parameter is not specified", () => {
            let x3p = new X3P();
            assert.equal("main.xml" in x3p.container.files, true);
            assert.equal("bindata/data.bin" in x3p.container.files, true);
            assert.equal("md5checksum.hex" in x3p.container.files, true);
        });
    });
});