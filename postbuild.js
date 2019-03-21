/**
 * Parcel adds a / to the worker url, this script removes that since it
 * messes up module resolution.
 */

const fs = require("fs");
const path = require("path");
const BUILD_DIR = __dirname + "/dist";
const BUILD_FILE_NAME = BUILD_DIR + "/index.js";
const BUILD_FILE_CONTENTS = fs.readFileSync(BUILD_FILE_NAME, { encoding: "utf-8" });

function getWorkerName() {
    for(let file of fs.readdirSync(BUILD_DIR)) {
        if(file.match(/^worker.(.*)\.js$/)) return file;
    }   
}

void async function main() {
    let workerName = getWorkerName();
    let newContent = BUILD_FILE_CONTENTS.replace(`/${workerName}`, workerName);
    fs.writeFileSync(BUILD_FILE_NAME, newContent);
}();