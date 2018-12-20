import jszip from "jszip";
import Promisable from "./promisable";
import { parse, ElementTree } from "elementtree";
import X3PLoader from "index";
import ndarray from "ndarray";
import Axis from "./axis";
import Mask from "mask";

const ZipLoader = jszip();

interface X3POptions {
    loader: X3PLoader;
    manifest: ElementTree;
    mask: Mask;
    pointBuffer?: ArrayBuffer;
}

export default class X3P {
    private options: X3POptions;
    private loader: X3PLoader;
    private manifest: ElementTree;
    private mask: Mask;
    private pointBuffer?: ArrayBuffer;
    private matrix?: ndarray;
    public axes?: { x: Axis, y: Axis, z: Axis };

    constructor(options: X3POptions) {
        this.options = options;
        this.loader = options.loader;
        this.manifest = options.manifest;
        this.pointBuffer = options.pointBuffer;
        this.mask = options.mask;
        this.axes = {
            x: new Axis({ name: "X", manifest: this.manifest }),
            y: new Axis({ name: "Y", manifest: this.manifest }),
            z: new Axis({ name: "Z", manifest: this.manifest })
        };
    }
}

 