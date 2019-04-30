/**
 * Parcel adds a / to the worker url, this script removes that since it
 * messes up module resolution.
 */

const fs = require("fs");
const path = require("path");
const BUILD_DIR = __dirname + "/dist";
const BUILD_FILE_NAME = BUILD_DIR + "/index.js";
const BUILD_FILE_CONTENTS = fs.readFileSync(BUILD_FILE_NAME, { encoding: "utf-8" });

function getWorkerNames() {
    let results = [];

    for(let file of fs.readdirSync(BUILD_DIR)) {
        if(file.match(/^worker.(.*)\.js$/)) results.push(file);
    }   

    return results;
}

void async function main() {
    let workerNames = getWorkerNames();
    let newContent = BUILD_FILE_CONTENTS;

    for(let workerName of workerNames) {
        newContent = newContent.replace(`/${workerName}`, workerName);
    }

    fs.writeFileSync(BUILD_FILE_NAME, newContent);
}();