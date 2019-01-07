import "jsdom-global/register";

import X3P from "../src";

import { readdirSync as readdir, readFileSync as read } from "fs";
import { resolve } from "path";

describe("X3PLoader", () => {
    describe("constructor()", () => {
        it("Should throw an error when supplied a file that isn't an X3P", () => {
            expect(new X3P({
                file: "test",
                name: "test",
            })).rejects.toBe("Invalid X3P File Specified");
        });

        it("Should throw an error when supplied a zip container that doesn't have main.xml", () => {
            let file = read(resolve(__dirname, "data/bad/[nu] no-manifest.x3p"));
            
            expect(new X3P({
                file,
                name: "test",
            })).rejects.toBe("X3P files must contain a main.xml file");
        });

        it("Should not reject a valid X3P file", () => {
            let file = read(resolve(__dirname, "data/good/complete.x3p"));

            expect(new X3P({
                file,
                name: "test",
            })).resolves;
        });

        it("Should accept a File object and use its name instead of the name parameter", async () => {
            let contents = read(resolve(__dirname, "data/good/complete.x3p"));            
            let file: File|null = new File([ contents ], "complete.x3p");
            let x3p = new X3P({ file });

            await x3p;

            return expect(x3p.name).toBe("complete.x3p");
        });
    });

    describe("write", () => {
        it("should update existing files in the X3P", async () => {
            let contents = read(resolve(__dirname, "data/good/complete.x3p"));

            let loader = new X3P({
                file: contents,
                name: "test.x3p", 
            });

            await loader;
            loader.write("main.xml", "This is a test");
            
            let manifest = await loader.read("main.xml");
            return expect(manifest).toBe("This is a test");
        });

        it("Should create new files in the X3P", async () => {
            let file = read(resolve(__dirname, "data/good/complete.x3p"));
            let loader = new X3P({
                file, 
                name: "test",
            });

            await loader;
            loader.write("arbitrary.xml", "New File");
            
            let arbitrary = await loader.read("arbitrary.xml");
            expect(arbitrary).toBe("New File");
        });
    });
});    
