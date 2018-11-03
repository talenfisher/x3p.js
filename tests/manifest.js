/* global it, describe */
const Manifest = require("../bin/x3p").Manifest;
const assert = require("chai").assert;

const DOCUMENT = `<?xml version="1.0" encoding="UTF-8"?><root><x>y</x></root>`;

describe("Manifest", () => {
    describe("get", () => {
        it("should retrieve the value of a node", () => {
            let manifest = new Manifest(DOCUMENT);
            assert.strictEqual(manifest.get("./x"), "y");
        });
    });

    describe("set", () => {
        it("should update the value stored in a node", () => {
            let manifest = new Manifest(DOCUMENT);
            manifest.set("x", "z");
            assert.strictEqual(manifest.get("./x"), "z");
        });
    });
});