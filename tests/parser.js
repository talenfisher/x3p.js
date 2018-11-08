/* global it, describe */
const assert = require("chai").assert;
const ElementTree = require("elementtree");
const parse = require("../bin/x3p").parse;
const fs = require("fs");
const path = require("path");

const CL_XML = fs.readFileSync(path.resolve("tests/artifacts/csafe-logo-main.xml"), "utf8");

describe("Parser", () => {
    let result = parse(CL_XML);
    console.log(result.errors);
});