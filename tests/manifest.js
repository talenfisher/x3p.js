/* global it, describe */
const Manifest = require("../bin/x3p").Manifest;
const assert = require("chai").assert;

const STR_TEST = `<?xml version="1.0" encoding="UTF-8"?><root><x>y</x></root>`;
const NUM_TEST = `<?xml version="1.0" encoding="UTF-8"?><root><x>1.1</x></root>`;

describe("Manifest", () => {
    describe("get", () => {
        it("should retrieve the value of a node", () => {
            let manifest = new Manifest(STR_TEST);
            assert.strictEqual(manifest.get("./x"), "y");
        });
    });

    describe("getInt", () => {
        it("should correctly return the integer value in a node", () => {
            let manifest = new Manifest(NUM_TEST);
            assert.strictEqual(manifest.getInt("./x"), 1);
        });
    });

    describe("getFloat", () => {
        it("should correctly return the floating point value in a node", () => {
            let manifest = new Manifest(NUM_TEST);
            assert.strictEqual(manifest.getFloat("./x"), 1.1);
        });
    });

    describe("set", () => {
        it("should update the value stored in a node", () => {
            let manifest = new Manifest(STR_TEST);
            manifest.set("x", "z");
            assert.strictEqual(manifest.get("./x"), "z");
        });
    });
});