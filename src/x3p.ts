import Axis from "./axis";
import X3PLoader from "./index";
import Manifest from "./manifest";
import Mask from "./mask";
import Renderer, { RendererOptions } from "./renderer";

import { saveAs } from "file-saver";
import ndarray = require("ndarray");

export interface X3POptions {
    name: string;
    loader: X3PLoader;
    manifest: Manifest;
    mask: Mask;
    pointBuffer?: ArrayBuffer;
}

export default class X3P {
    public axes: { x: Axis, y: Axis, z: Axis };
    public manifest: Manifest;
    public pointBuffer?: ArrayBuffer;
    public mask: Mask;
    public saveMask: boolean = true; // use for testing/debugging

    private loader: X3PLoader;
    private options: X3POptions;
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

    public async save() {
        this.loader.write("main.xml", this.manifest.toString());
        this.loader.write("md5checksum.hex", `${this.manifest.checksum} *main.xml`);

        if(this.saveMask && this.mask.canvas) { // save mask
            let canvas = this.mask.canvas;
            let blob = await canvas.toBlob();
            this.loader.write("bindata/mask.png", blob);
        }
    }

    public async download(filename = this.name) {
        let blob = await this.loader.toBlob();
        if(!blob) return;

        saveAs(blob, filename);
    }

    public render(canvas: HTMLCanvasElement, options?: RendererOptions) {
        if(!this.pointBuffer) return;

        let defaults = {
            x3p: this,
            canvas,
            lighting: {
                ambient: 0.05,
                diffuse: 0.4,
                specular: 0.2,
                roughness: 0.5,
            },
        };
        
        return new Renderer(Object.assign(defaults, options));
    }
}
