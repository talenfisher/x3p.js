import md5 from "blueimp-md5";
import { readdirSync as readdir, readFileSync as read } from "fs";
import { resolve } from "path";

import Manifest from "../src/manifest";
import X3P from "../src/x3p";
import X3PLoader from "../src";
import ndarray = require("ndarray");

declare var window: any;

const Parser = new window.DOMParser();
const parse = (value: string) => Parser.parseFromString(value, "application/xml");

describe("X3P", () => {
    describe("save", () => {
        it("Should update main.xml in the loader's zip container", async () => {
            let expected = read(resolve(__dirname, "expects/x3p.save.1.xml"), { encoding: "utf-8" });
            let file = read(resolve(__dirname, "data/good/complete.x3p"));
            let loader = new X3PLoader({
                file,
                name: "test",
            });

            let x3p = await loader as unknown as X3P;
            x3p.manifest.set("Record1 Revision", "CSAFE-X3P");
            x3p.save();
            
            let manifest = await loader.read("main.xml");
            expect(manifest).toBe(expected);
        });

        it("Should update md5checksum.hex with the new checksum of main.xml", async () => {
            let file = read(resolve(__dirname, "data/good/complete.x3p"));
            let loader = new X3PLoader({
                file,
                name: "test",
            }); 

            let x3p = await loader as unknown as X3P;
            x3p.manifest.set("Record1 Revision", "CSAFE-X3P");
            x3p.save();

            let expectedChecksum = md5(await loader.read("main.xml") as string);
            let actualChecksum = await loader.read("md5checksum.hex");
            expect(actualChecksum).toBe(`${expectedChecksum} *main.xml`);
        });
    });
});
