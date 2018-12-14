import jszip from "jszip";
import { ElementTree } from "elementtree";

interface X3PParameter {
    zip: jszip;
    name: string;
    manifest: ElementTree;
    bindata?: ArrayBuffer;
}

export default class X3P {
    private zip: jszip;
    private name: string;
    private manifest: ElementTree;
    private bindata?: ArrayBuffer;

    constructor(options: X3PParameter) {
        this.zip = options.zip;
        this.name = options.name;
        this.manifest = options.manifest;
        this.bindata = options.bindata;
    }
}

 