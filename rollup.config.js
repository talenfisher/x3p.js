const terser = require("rollup-plugin-terser").terser;

module.exports = {
    plugins: [terser()],
    input: "src/x3p.js",
    output: {
        name: "x3p",
        file: "bin/x3p.js",
        format: "umd"
    }
}