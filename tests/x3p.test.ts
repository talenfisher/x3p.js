import "jsdom-global/register";

import md5 from "blueimp-md5";
import { parse } from "elementtree";
import { readdirSync as readdir, readFileSync as read } from "fs";
import { resolve } from "path";

import X3PLoader from "../src";
import X3P from "../src/x3p";

describe("X3P", () => {
    describe("save", () => {
        it("Should update main.xml in the loader's zip container", async () => {
            let file = read(resolve(__dirname, "data/good/complete.x3p"));
            let loader = new X3PLoader({
                file,
                name: "test",
            });

            let x3p = await loader;
            x3p.manifest.parse(`<root><test>1</test></root>`);
            x3p.save();
            
            let manifest = await loader.read("main.xml");
            expect(manifest).toBe("<?xml version='1.0' encoding='utf-8'?>\n<root><test>1</test></root>");
        });

        it("Should update md5checksum.hex with the new checksum of main.xml", async () => {
            let file = read(resolve(__dirname, "data/good/complete.x3p"));
            let loader = new X3PLoader({
                file,
                name: "test",
            });

            let x3p = await loader;
            x3p.manifest.parse(`<root><test>1</test></root>`);
            x3p.save();

            let expectedChecksum = md5(<string> await loader.read("main.xml"));
            let actualChecksum = await loader.read("md5checksum.hex");
            expect(actualChecksum).toBe(`${expectedChecksum} *main.xml`);
        });
    });
});