import Manifest from "./manifest";
import Mask from "./mask/index";
import X3P from "./index";
import { DEFAULT_MISSING_FACTOR_THRESHOLD } from "./constants";

import jszip from "jszip";
import { EventEmitter } from "events";

export interface LoaderOptions {
    file: any;
    name?: string;
    defaultMask?: string;
    missingFactorThreshold?: number;
}

export type Encoding = 
    "base64" |
    "text" |
    "binarystring" |
    "array" |
    "uint8array" |
    "arraybuffer" |
    "blob" |
    "nodebuffer";

/**
 * Loads binary data into an X3P object
 * 
 * @author Talen Fisher
 */
export default class Loader extends EventEmitter {

    /**
     * Optional filename to use
     */
    public name?: string;

    /**
     * The options originally passed to the Loader
     */
    private options: LoaderOptions;

    /**
     * JsZip file for uncompressing and recompressing data from/to
     */
    private zip?: jszip;

    /**
     * The manifest file
     */
    private manifest?: Manifest;

    /**
     * Base folder to search for files in
     */
    private root?: string = "";

    /**
     * Default mask to use for the manifest
     */
    private defaultMask?: string;

    /**
     * Constructs a new X3P Loader
     * 
     * @param options options to use for loading the X3P file
     */
    constructor(options: LoaderOptions) {
        super();
        this.options = options;
        this.name = options.file.name || options.name || "file.x3p";
        this.defaultMask = options.defaultMask || this.defaultMask;
        this.load();
    }

    /**
     * Determines whether or not a file is present in the X3P
     * 
     * @param filename the filename to search for
     */
    public hasFile(filename: string) {
        return this.zip && this.zip.file(filename) !== null;
    }

    /**
     * Reads a file from the X3P
     * 
     * @param filename name of the file to read
     * @param encoding how the result should be encoded (defaults to text)
     */
    public read(filename: string, encoding: Encoding = "text") {
        if(!this.zip) return;

        let file = this.zip.file(this.root+filename);
        return file !== null ? file.async(encoding) : undefined;
    }

    /**
     * Writes to a file in the X3P
     * 
     * @param filename name of the file to write to
     * @param data the data to write
     */
    public write(filename: string, data: any) {
        if(!this.zip) return;

        this.zip.file(this.root+filename, data);
    }

    /**
     * Converts the X3P file that has been loaded into blob format
     */
    public toBlob() {
        if(!this.zip) return;

        return this.zip.generateAsync({
            type: "blob",
            compression: "DEFLATE",
            compressionOptions: {
                level: 9,
            },
        });
    }

    /**
     * Loads data into the X3P object
     */
    private async load() {
        let ZipLoader: jszip = jszip();

        try {
            this.zip = await ZipLoader.loadAsync(this.options.file);
        } catch(e) {
            return this.emit("error", "Invalid X3P File Specified");
        }

        // check for manifest
        const search = this.zip.file(/main\.xml$/g);
        if(search.length === 0) {
            return this.emit("error", "X3P files must contain a main.xml file");
        }

        // check for nesting inside another folder
        let file = search[0];
        if(search.length > 0 && search[0].name !== "main.xml") {    
            this.root = file.name.replace("main.xml", "");
        }

        this.manifest = new Manifest(await file.async("text"), this.defaultMask);
        let pointBuffer = await this.getPointBuffer();
        let mask = await this.getMask() as Mask;
        let missingFactorThreshold = this.options.missingFactorThreshold || DEFAULT_MISSING_FACTOR_THRESHOLD;

        this.emit("load", new X3P({
            loader: this,
            manifest: this.manifest,
            mask,
            name: this.name as string,
            pointBuffer,
            missingFactorThreshold,
        }));
    }

    /**
     * Gets the X3P's data point buffer from the PointDataLink (usually just bindata/data.bin)
     */
    private async getPointBuffer() {
        if(!this.manifest) return;
        let pointFile = this.manifest.get("Record3 DataLink PointDataLink") as string | undefined;
        return typeof pointFile !== "undefined" ? await this.read(pointFile, "arraybuffer") as ArrayBuffer : undefined;
    }

    /**
     * Load the X3P's mask
     */
    private async getMask() {
        if(!this.manifest || !this.zip) return;
        let data = await this.getMaskData();
        
        return new Mask({
            manifest: this.manifest,
            data,
        });
    }

    /**
     * Extract the mask's image file using the mask definition.  If the definition or
     * link doesn't exist, it looks for the mask data at bindata/texture.png, and then 
     * at bindata/texture.jpeg.
     * 
     * @param definition definition for an X3P mask
     */
    private getMaskData(definition?: Element) {
        let link = definition ? definition.querySelector("Link") : null;
        let filename = link !== null ? link.nodeValue : "bindata/mask.png";
        return this.read(filename as string, "arraybuffer") as Promise<ArrayBuffer> | undefined;
    }
}

export { default as X3P } from "./index";
