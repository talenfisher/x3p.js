import X3P from "../dist";

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
    });

    describe("write", () => {
        it("should update existing files in the X3P", async () => {
            let file = read(resolve(__dirname, "data/good/complete.x3p"));
            let loader = new X3P({
                file,
                name: "test", 
            });

            await loader;
            loader.write("main.xml", "This is a test");
            
            let manifest = await loader.read("main.xml");
            expect(manifest).toBe("This is a test");
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
