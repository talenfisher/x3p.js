import { default as jszip, JSZipObject } from "jszip";
import { parse, ElementTree } from "elementtree";
import X3P from "./x3p";

const ZipLoader = jszip();

interface LoaderOptions {
    file: any;
    name: string;
}

export default class Loader {
    private options: LoaderOptions;
    private promise: Promise<X3P>;
    private zip?: jszip;
    private manifest?: ElementTree;
    private bindata?: ArrayBuffer;
    private root: string = "";
    

    constructor(options: LoaderOptions) {
        this.options = options;
        this.promise = new Promise(this.load.bind(this));
    }

    load(resolve: any, reject: any) {
        ZipLoader.loadAsync(this.options.file)

        // load zip, check for manifest, 
        .then(
            async zip => { 
                this.zip = zip;
                let search = zip.file(/main\.xml$/g);

                if(search.length == 0) {
                    reject("X3P files must contain a main.xml");
                }

                if(search.length > 0 && search[0].name !== "main.xml") {
                    let file = search[0];
                    this.root = file.name.replace("main.xml", "");
                    this.manifest = parse(await file.async("text"));
                    
                    let dataFileRecord = this.manifest.find("./Record3/DataLink/PointDataLink");
                    let dataFile = dataFileRecord !== null ? dataFileRecord.text : null;

                    if(dataFile) {
                        this.bindata = <ArrayBuffer> await this.fetch(<string> dataFile, "arraybuffer");
                    }
                }
            },
            e => reject("Invalid X3P File Specified")
        );
    }

    /**
     * Promise resolution proxy
     */
    then() {
        //@ts-ignore
        return this.promise.then.apply(this.promise, arguments);
    }

    /**
     * Promise rejection proxy
     */
    catch() {
        //@ts-ignore
        return this.promise.catch.apply(this.promise, arguments);
    }

    fetch(filename: string, encoding: "base64"|"text"|"binarystring"|"array"|"uint8array"|"arraybuffer"|"blob"|"nodebuffer" = "text") {
        if(!this.zip) return;

        let file = this.zip.file(this.root+filename);
        return file !== null ? file.async(encoding) : undefined;
    }
}