import X3P from "./x3p";
import jszip, { JSZipObject } from "jszip";
import Promisable from "./promisable";
import { ElementTree, parse } from "elementtree";
import Mask from "./mask";

const ZipLoader = jszip();

export interface X3PLoaderOptions {
    file: any;
    name: string;
    color?: string;
}
export default class X3PLoader extends Promisable<X3P> {
    private options: X3PLoaderOptions;
    private name: string;
    private zip?: jszip;
    private manifest?: ElementTree;
    private root?: string;


    constructor(options: X3PLoaderOptions) {
        super();
        this.options = options;
        this.name = options.name;
        this.promise = new Promise(this.load.bind(this));
    }

    private async load(resolve: any, reject: any) {
        let search, file, pointBuffer;

        try {
            this.zip = await ZipLoader.loadAsync(this.options.file);
        } catch(e) {
            return reject("Invalid X3P File Specified");
        }
        
        // check for manifest
        search = this.zip.file(/main\.xml$/g);
        if(search.length == 0) {
            return reject("X3P files must contain a main.xml file");
        }

        // check for nesting inside another folder
        file = search[0];
        if(search.length > 0 && search[0].name !== "main.xml") {    
            this.root = file.name.replace("main.xml", "");
        }

        this.manifest = parse(await file.async("text"));        
        pointBuffer = await this.getPointBuffer();

        return resolve(new X3P({
            loader: this,
            manifest: this.manifest,
            pointBuffer
        }));
    }

    private async getPointBuffer() {
        if(!this.manifest) return;

        let pointFileRecord = this.manifest.find("./Record3/DataLink/PointDataLink");
        let pointFile = pointFileRecord !== null ? pointFileRecord.text : null;

        return pointFile ? <ArrayBuffer> await this.read(pointFile.toString(), "arraybuffer") : undefined;
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
     * link doesn't exist, it looks for the mask data at bindata/texture.jpeg
     * 
     * @param definition definition for an X3P mask
     */
    private getMaskData(definition?: ElementTree) {
        let link = definition ? definition.find("./Link") : null;
        let filename = link !== null ? link.text : "bindata/texture.jpeg";

        return this.read(<string> filename, "uint8array");
    }

    public hasFile(filename: string) {
        return this.zip && this.zip.file(filename) !== null;
    }

    public read(filename: string, encoding: "base64"|"text"|"binarystring"|"array"|"uint8array"|"arraybuffer"|"blob"|"nodebuffer" = "text") {
        if(!this.zip) return;

        let file = this.zip.file(this.root+filename);
        return file !== null ? file.async(encoding) : undefined;
    }
}