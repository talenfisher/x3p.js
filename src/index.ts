
import Mask from "./mask/index";
import Promisable from "./promisable";
import X3P from "./x3p";

import { ElementTree, parse } from "elementtree";
import jszip, { JSZipObject } from "jszip";

const ZipLoader = jszip();

export interface X3PLoaderOptions {
    file: any;
    name: string;
    color?: string;
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

export default class X3PLoader extends Promisable<X3P> {
    public name: string;
    private options: X3PLoaderOptions;
    private zip?: jszip;
    private manifest?: ElementTree;
    private root?: string;

    constructor(options: X3PLoaderOptions) {
        super();
        this.options = options;
        this.name = options.name;
        this.promise = new Promise(this.load.bind(this));
    }

    public hasFile(filename: string) {
        return this.zip && this.zip.file(filename) !== null;
    }

    public read(filename: string, encoding: Encoding = "text") {
        if(!this.zip) return;

        let file = this.zip.file(this.root+filename);
        return file !== null ? file.async(encoding) : undefined;
    }

    public write(filename: string, data: any) {
        if(!this.zip) return;

        this.zip.file(this.root+filename, data);
    }

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

    private async load(resolve: any, reject: any) {
        try {
            this.zip = await ZipLoader.loadAsync(this.options.file);
        } catch(e) {
            return reject("Invalid X3P File Specified");
        }

        // check for manifest
        const search = this.zip.file(/main\.xml$/g);
        if(search.length === 0) {
            return reject("X3P files must contain a main.xml file");
        }

        // check for nesting inside another folder
        let file = search[0];
        if(search.length > 0 && search[0].name !== "main.xml") {    
            this.root = file.name.replace("main.xml", "");
        }

        this.manifest = parse(await file.async("text"));        
        let pointBuffer = await this.getPointBuffer();
        let mask = <Mask> await this.getMask();

        return resolve(new X3P({
            loader: this,
            manifest: this.manifest,
            mask,
            name: this.name,
            pointBuffer,
        }));
    }

    private async getPointBuffer() {
        if(!this.manifest) return;

        let pointFileRecord = this.manifest.find("./Record3/DataLink/PointDataLink");
        let pointFile = pointFileRecord !== null ? pointFileRecord.text : null;
        return pointFile ? <ArrayBuffer> await this.read(pointFile.toString(), "arraybuffer") : undefined;
    }

    /**
     * Load the X3P's mask
     */
    private async getMask() {
        if(!this.manifest || this.zip) return;

        let definition = await this.getMaskDefinition();
        let data = await this.getMaskData();
        
        return new Mask({
            manifest: this.manifest,
            definition,
            data,
        });
    }

    /**
     * Gets the mask definition.  First searches Record3 in main.xml, then for a mask.xml in the
     * X3P's root directory.
     */
    private async getMaskDefinition() {
        if(!this.manifest || !this.zip) return;

        return this.manifest.find("./Record3/Mask") || 
            this.hasFile("mask.xml") ? parse(<string> await this.read("mask.xml")) : undefined;
    }

    /**
     * Extract the mask's image file using the mask definition.  If the definition or
     * link doesn't exist, it looks for the mask data at bindata/texture.png, and then 
     * at bindata/texture.jpeg.
     * 
     * @param definition definition for an X3P mask
     */
    private getMaskData(definition?: ElementTree) {
        let link = definition ? definition.find("./Link") : null;
        let filename = link !== null ? link.text : "bindata/texture.png";
        
        if(!this.hasFile(<string> filename) && this.hasFile("bindata/texture.jpeg")) {
            filename = "bindata/texture.jpeg";
        }

        return <Promise<ArrayBuffer> | undefined> this.read(<string> filename, "arraybuffer");
    }
}
