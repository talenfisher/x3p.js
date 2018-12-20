import Axis from "./axis";
import X3PLoader from "./index";
import Mask from "./mask";
import Promisable from "./promisable";

import { ElementTree, parse } from "elementtree";
import jszip from "jszip";
import ndarray from "ndarray";

const ZipLoader = jszip();

interface X3POptions {
    loader: X3PLoader;
    manifest: ElementTree;
    mask: Mask;
    pointBuffer?: ArrayBuffer;
}

export default class X3P {
    public axes?: { x: Axis, y: Axis, z: Axis };
    private options: X3POptions;
    private loader: X3PLoader;
    private manifest: ElementTree;
    private mask: Mask;
    private pointBuffer?: ArrayBuffer;
    private matrix?: ndarray;

    constructor(options: X3POptions) {
        this.options = options;
        this.loader = options.loader;
        this.manifest = options.manifest;
        this.pointBuffer = options.pointBuffer;
        this.mask = options.mask;
        this.axes = {
            x: new Axis({ name: "X", manifest: this.manifest }),
            y: new Axis({ name: "Y", manifest: this.manifest }),
            z: new Axis({ name: "Z", manifest: this.manifest }),
        };
    }
}
