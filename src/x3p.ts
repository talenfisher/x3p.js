import Axis from "./axis";
import X3PLoader from "./index";
import Mask from "./mask";
import Promisable from "./promisable";

import md5 from "blueimp-md5";
import { ElementTree, parse } from "elementtree";
import { saveAs } from "file-saver";
import jszip from "jszip";
import ndarray from "ndarray";

const ZipLoader = jszip();

interface X3POptions {
    name: string;
    loader: X3PLoader;
    manifest: ElementTree;
    mask: Mask;
    pointBuffer?: ArrayBuffer;
}
export default class X3P {
    public axes?: { x: Axis, y: Axis, z: Axis };
    public manifest: ElementTree;
    private loader: X3PLoader; // public for testing purposes only
    private options: X3POptions;
    private mask: Mask;
    private pointBuffer?: ArrayBuffer;
    private matrix?: ndarray;
    private name: string;

    constructor(options: X3POptions) {
        this.options = options;
        this.loader = options.loader;
        this.manifest = options.manifest;
        this.pointBuffer = options.pointBuffer;
        this.mask = options.mask;
        this.name = options.name;
        this.axes = {
            x: new Axis({ name: "X", manifest: this.manifest }),
            y: new Axis({ name: "Y", manifest: this.manifest }),
            z: new Axis({ name: "Z", manifest: this.manifest }),
        };
    }

    public save() {
        let manifest = this.manifest.write();
        this.loader.write("main.xml", manifest);
        this.loader.write("md5checksum.hex", `${md5(manifest)} *main.xml`);
    }

    public async download(filename = this.name) {
        let blob = await this.loader.toBlob();
        if(!blob) return;

        saveAs(blob, filename);
    }
}
