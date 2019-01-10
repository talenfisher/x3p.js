'use strict';
const fs = require("fs");
const path = require("path");

module.exports = {
    process(src, filename) {
        let value = fs.readFileSync(filename);
        return `module.exports=\`${value}\`;`;
    }
};