import Axis from "./axis";
import X3PLoader from "./index";
import Mask from "./mask";
import Manifest from "./manifest";
import Promisable from "./promisable";

import { saveAs } from "file-saver";
import jszip from "jszip";
import ndarray from "ndarray";

const ZipLoader = jszip();

interface X3POptions {
    name: string;
    loader: X3PLoader;
    manifest: Manifest;
    mask: Mask;
    pointBuffer?: ArrayBuffer;
}
export default class X3P {
    public axes?: { x: Axis, y: Axis, z: Axis };
    public manifest: Manifest;
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
        this.loader.write("main.xml", this.manifest.toString());
        this.loader.write("md5checksum.hex", `${this.manifest.checksum} *main.xml`);
    }

    public async download(filename = this.name) {
        let blob = await this.loader.toBlob();
        if(!blob) return;

        saveAs(blob, filename);
    }
}
