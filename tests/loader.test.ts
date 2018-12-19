import X3P from "../dist";
import { readFileSync as read, readdirSync as readdir } from "fs";
import { resolve } from "path";



describe("X3PLoader", () => {
    describe("constructor()", () => {
        it("Should throw an error when supplied a file that isn't an X3P", () => {
            expect(new X3P({
                file: "test",
                name: "test"
            })).rejects.toBe("Invalid X3P File Specified");
        });

        it("Should throw an error when supplied a zip container that doesn't have main.xml", () => {
            let file = read(resolve(__dirname, "data/bad/[nu] no-manifest.x3p"));
            
            expect(new X3P({
                file: file,
                name: "test"
            })).rejects.toBe("X3P files must contain a main.xml file");
        });

        it("Should not reject a valid X3P file", () => {
            let file = read(resolve(__dirname, "data/good/complete.x3p"));

            expect(new X3P({
                file: file,
                name: "test"
            })).resolves;
        });
    });
});    