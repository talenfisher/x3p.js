import Loader from "../src/loader";

import { readdirSync as readdir, readFileSync as read } from "fs";
import { resolve } from "path";

describe("X3PLoader", () => {
    describe("constructor()", () => {
        it("Should throw an error when supplied a file that isn't an X3P", () => {
            expect(new Promise((resolve, reject) => {
                new Loader({
                    file: "...",
                    name: "test"
                })
                .on("error", (error) => reject(error))
                .on("load", (x3p) => resolve(x3p));
            })).rejects.toBe("Invalid X3P File Specified");
        });

        it("Should throw an error when supplied a zip container that doesn't have main.xml", () => {
            let file = read(resolve(__dirname, "data/bad/[nu] no-manifest.x3p"));
            
            expect(new Promise((resolve, reject) => {
                    new Loader({
                    file,
                    name: "test",
                })
                .on("error", (error) => reject(error))
                .on("load", (x3p) => resolve(x3p));
            })).rejects.toBe("X3P files must contain a main.xml file");
        });

        it("Should not reject a valid X3P file", () => {
            let file = read(resolve(__dirname, "data/good/complete.x3p"));

            expect(new Promise((resolve, reject) => {
                new Loader({
                    file,
                    name: "test",
                })
                .on("error", (error) => reject(error))
                .on("load", (x3p) => resolve(x3p));
            })).resolves;
        });
    });

    describe("write", () => {
        it("should update existing files in the X3P", async () => {
            let contents = read(resolve(__dirname, "data/good/complete.x3p"));

            let loader = new Loader({
                file: contents,
                name: "test.x3p", 
            })

            .on("load", async () => {
                loader.write("main.xml", "This is a test");
            
                let manifest = await loader.read("main.xml");
                return expect(manifest).toBe("This is a test");
            });
        });

        it("Should create new files in the X3P", async () => {
            let file = read(resolve(__dirname, "data/good/complete.x3p"));
            let loader = new Loader({
                file, 
                name: "test",
            })
            
            .on("load", async () => {
                loader.write("arbitrary.xml", "New File");
            
                let arbitrary = await loader.read("arbitrary.xml");
                expect(arbitrary).toBe("New File");
            });
        });
    });
});    
