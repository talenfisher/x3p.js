import { EventEmitter } from "events";
import JSZip from "jszip";
import Manifest from "./manifest";
import PositionsBuilder from "./positionsbuilder";
import DEFAULTS from "./defaults";

const MANIFEST_FILENAME = "main.xml";

export default class X3P extends EventEmitter {
    
    /**
     * Constructs a new X3P object
     * 
     * @param {File} file optional file to load
     * @param {string} name optional filename
     */
    constructor(file = null, name = null) {
        super();

        this._file = new JSZip();
        this._name = name;
        this._root = "";
        this._positions = [];


        this.on("read", this._bootstrap.bind(this));

        if(file !== null) {
            this.container
                .loadAsync(file)
                .then(() => this.emit("read"))
                .catch(() => this.emit("error", "The 'file' parameter was invalid.  Please specify a valid X3P container file."));

        } else {
            this._file.file("main.xml", DEFAULTS["main.xml"]);
            this._file.file("bindata/data.bin", DEFAULTS["bindata/data.bin"]);
            this._file.file("md5checksum.hex", DEFAULTS["md5checksum.hex"]);
            this.emit("read");
        }
    }

    /**
     * Performs checks on the loaded X3P container and sets up 
     * additional properties if needed
     */
    async _bootstrap() {
        this._checkOutputSupport();
        this._checkRoot();
        await this._checkManifest();
        await this._checkDataFile();
        
        try {
            if(this._data !== null) {
                this._positionsBuilder = new PositionsBuilder({ manifest: this._manifest, data: this._data });
            }
        } catch(err) { 
            // do nothing 
        }

        this.emit("load"); 
    }

    /**
     * Check for output type support (blob or node buffer)
     */
    _checkOutputSupport() {
        this._outputType = JSZip.support.blob ? "blob" : null;
        this._outputType = JSZip.support.nodebuffer ? "nodebuffer" : null;

        if(this._outputType === null) {
            throw new Error("No supported output type (blob, nodebuffer) detected");
        }
    }

    /**
     * Check if container files are wrapped in a folder
     */
    _checkRoot() {
        let result = this.container.file(/main\.xml$/g);

        if(result.length > 0 && result[0].name !== "main.xml") {
            this._root = result[0].name.replace("main.xml", "");
        }
    }

    /**
     * X3P files should always contain a main.xml
     */
    async _checkManifest() {
        if(!this.fileNames.includes(MANIFEST_FILENAME)) {
            throw new Error("X3P format requires a main.xml file");
        }

        this._manifest = new Manifest(await this.readFile(MANIFEST_FILENAME));
    }

    /**
     * X3P files should have a point data file
     */
    async _checkDataFile() {
        let xpath = "./Record3/DataLink/PointDataLink";
        this._dataFile = this._manifest.get(xpath);
        this._data = (this.fileNames.includes(this._dataFile)) ? await this.readFile(this._dataFile) : null;
    }

    /**
     * Reads the contents of a file in the X3P container
     * 
     * @param {String} filename the name of the file in the container to read
     * @param {String} type  the type of output to retrieve
     * @return {Promise} a promise that resolves to file contents of the specified type or null if the file doesn't exist
     */
    readFile(filename, type = "text") {
        let file = this.container.file(this._root+filename);
        return file === null ? null : file.async(type);
    }

    /**
     * Get a list of filenames within the container
     */
    get fileNames() {
        let result = [];
        
        for(let filename of Object.keys(this.container.files)) {
            let exp = new RegExp(`^${this._root}`, "gi");
            filename = filename.replace(exp, "");

            if(filename !== "") {
                result.push(filename);
            }
        }

        return result;
    }

    /**
     * Getter for file
     * 
     * @return {JSZip} the X3P file as a JSZip Object
     */
    get container() {
        return this._file;
    }

    /**
     * Getter for filename
     * 
     * @return {string} the name of the X3P file
     */
    get name() {
        return this._name;
    }

    /**
     * Setter for filename
     */
    set name(name) {
        this._name = name;
    }

    /**
     * Getter for vertex positions
     */
    get vertexPositions() {
        return typeof this._positionsBuilder !== "undefined" ? this._positionsBuilder.result : undefined;
    }

    /**
     * Converts the X3P file into a blob/buffer
     * 
     * @return {Promise} a promise that resolves to a blob or node buffer
     */
    toBlob() {
        return this.container.generateAsync({
            type: this._outputType,
            compression: "DEFLATE",
            compressionOptions: {
                level: 9 
            }
        });
    }
}