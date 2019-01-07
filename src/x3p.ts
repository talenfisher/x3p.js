import Axis from "./axis";
import X3PLoader from "./index";
import Manifest from "./manifest";
import Mask from "./mask";
import Matrix from "./matrix";
// import Renderer from "./renderer";

import { saveAs } from "file-saver";

interface X3POptions {
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
    public matrix?: Matrix;

    private loader: X3PLoader;
    private options: X3POptions;
    private mask: Mask;
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

        if(this.pointBuffer) {
            this.matrix = new Matrix({
                manifest: this.manifest,
                axes: this.axes,
                pointBuffer: this.pointBuffer,
            });
        }
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

    // public render(canvas: HTMLCanvasElement) {
    //     if(!this.pointBuffer) return;

    //     let renderer = new Renderer({
    //         x3p: this,
    //         canvas,
    //     });

    //     return renderer;
    // }
}
