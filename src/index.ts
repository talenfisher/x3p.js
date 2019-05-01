import Axis from "./axis";
import Manifest from "./manifest";
import Mask from "./mask/index";
import Renderer, { RendererOptions } from "./renderer/index";
import Loader, { LoaderOptions } from "./loader";
import { saveAs } from "file-saver";

export interface X3POptions {
    name: string;
    loader: Loader;
    manifest: Manifest;
    mask: Mask;
    pointBuffer?: ArrayBuffer;
}

/**
 * This class provides primary X3P file interactions.  Includes
 * interfaces for interacting with the manifest (main.xml), axes, 
 * point buffer and mask. 
 * 
 * @author Talen Fisher
 */
export default class X3P {
    /**
     * x, y and z axes data
     */
    public readonly axes: { x: Axis, y: Axis, z: Axis };

    /**
     * The X3P's manifest/main.xml data
     */
    public readonly manifest: Manifest;

    /**
     * Buffer for 3D point data (this usually comes from bindata/data.bin)
     */
    public readonly pointBuffer?: ArrayBuffer;

    /**
     * The X3P's mask data (this usually comes from bindata/mask.png)
     */
    public readonly mask: Mask;

    /**
     * FOR TESTING AND DEBUG PURPOSES
     * Whether or not to save the mask data
     */
    public saveMask: boolean = true; // use for testing/debugging

    /**
     * The loader used to load this X3P file
     */
    public readonly loader: Loader;

    /**
     * Options that were used to construct this X3P object
     */
    private options: X3POptions;

    /**
     * The X3P's filename
     */
    private name: string;

    /**
     * Constructs a new X3P object.  Don't instantiate this directly, use X3P.load or X3PLoader instead.
     * 
     * @param options options to use for the new X3P object
     */
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

    /**
     * Saves all changes made to X3P assets
     */
    public async save() {
        this.loader.write("main.xml", this.manifest.toString());
        this.loader.write("md5checksum.hex", `${this.manifest.checksum} *main.xml`);

        if(this.saveMask && this.mask.canvas) { // save mask
            let canvas = this.mask.canvas;
            let blob = await canvas.toBlob();
            this.loader.write("bindata/mask.png", blob);
        }
    }

    /**
     * Downloads the X3P file
     * 
     * @param filename filename to use for the downloaded file
     */
    public async download(filename = this.name) {
        let blob = await this.loader.toBlob();
        if(!blob) return;

        saveAs(blob, filename);
    }

    /**
     * Renders the X3P file onto a canvas.
     * 
     * @param canvas the canvas to render the X3P file onto
     * @param options options to be passed to the Renderer
     */
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
    
    /**
     * Loads an X3P file.
     * 
     * @param options options to be passed to the X3PLoader
     */
    public static load(options: LoaderOptions): Promise<X3P> {
        return new Promise((resolve, reject) => {
            let loader = new Loader(options);
            loader.on("error", (error: string) => reject(error));
            loader.on("load", (x3p: X3P) => resolve(x3p));
        });
    }
}

export let load = X3P.load;
export { default as Axis } from "./axis";
export { default as Mask } from "./mask/index";
export { default as Manifest } from "./manifest";
export { default as Renderer } from "./renderer/index";
export { default as Loader } from "./loader";
