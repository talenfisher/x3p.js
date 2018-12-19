import X3P from "./x3p";
import jszip, { JSZipObject } from "jszip";
import Promisable from "./promisable";
import { ElementTree, parse } from "elementtree";

const ZipLoader = jszip();

export interface X3PLoaderOptions {
    file: any;
    name: string;
}
export default class X3PLoader extends Promisable<X3P> {
    private options: X3PLoaderOptions;
    private name: string;
    private zip?: jszip;
    private root?: string;
    private pointBuffer?: ArrayBuffer;


    constructor(options: X3PLoaderOptions) {
        super();
        this.options = options;
        this.name = options.name;
        this.promise = new Promise(this.load.bind(this));
    }

    private async load(resolve: any, reject: any) {
        let zip, manifest, search, file, pointFile, pointFileRecord, pointBuffer;

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

        manifest = parse(await file.async("text"));    
        pointFileRecord = manifest.find("./Record3/DataLink/PointDataLink");
        pointFile = pointFileRecord !== null ? pointFileRecord.text : null;
        pointBuffer = pointFile ? <ArrayBuffer> await this.read(pointFile.toString(), "arraybuffer") : undefined;

        return resolve(new X3P({
            loader: this,
            manifest,
            pointBuffer
        }));
    }

    public read(filename: string, encoding: "base64"|"text"|"binarystring"|"array"|"uint8array"|"arraybuffer"|"blob"|"nodebuffer" = "text") {
        if(!this.zip) return;

        let file = this.zip.file(this.root+filename);
        return file !== null ? file.async(encoding) : undefined;
    }
}