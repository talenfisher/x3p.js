import md5 from "blueimp-md5";
import { readdirSync as readdir, readFileSync as read } from "fs";
import { resolve } from "path";

import Manifest from "../src/manifest";
import X3P from "../src";
import ndarray = require("ndarray");

declare var window: any;
declare var global: any;

const Parser = new window.DOMParser();
const parse = (value: string) => Parser.parseFromString(value, "application/xml");

describe("X3P", () => {
    global.URL = {};
    global.URL.createObjectURL = jest.fn();

    describe("save", () => {
        it("Should update main.xml in the loader's zip container", async () => {
            let expected = read(resolve(__dirname, "expects/x3p.save.1.xml"), { encoding: "utf-8" });
            let file = read(resolve(__dirname, "data/good/complete.x3p"));
            let x3p = await X3P.load({
                file,
                name: "test",
            });

            x3p.saveMask = false;
            x3p.manifest.set("Record1 Revision", "CSAFE-X3P");
            x3p.save();

            let manifest = await x3p.loader.read("main.xml");
            expect(manifest).toBe(expected);
        });

        it("Should update md5checksum.hex with the new checksum of main.xml", async () => {
            let file = read(resolve(__dirname, "data/good/complete.x3p"));
            let x3p = await X3P.load({
                file,
                name: "test",
            }); 

            x3p.saveMask = false;
            x3p.manifest.set("Record1 Revision", "CSAFE-X3P");
            x3p.save();

            let expectedChecksum = md5(await x3p.loader.read("main.xml") as string);
            let actualChecksum = await x3p.loader.read("md5checksum.hex");
            expect(actualChecksum).toBe(`${expectedChecksum} *main.xml`);
        });
    });
});
