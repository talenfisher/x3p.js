import { EventEmitter } from "events";
import DEFAULTS from "./defaults";
import JSZip from "jszip";

export default class X3P extends EventEmitter {
    /**
     * 
     * @param {File|null} file optional file to load
     * @param {*} name 
     */
    constructor(file = null, name = null) {
        super();

        this._file = new JSZip();
        this._name = name;

        if(file !== null) {
            this._file.loadAsync(file);
            return;
        }

        // TODO: add defaults for each file
        this._file.file("main.xml", DEFAULTS["main.xml"]);
        this._file.file("bindata/data.bin", DEFAULTS["bindata/data.bin"]);
        this._file.file("md5checksum.hex", DEFAULTS["md5checksum.hex"]);

        this._checkOutputSupport();
        this._checkRoot();
    }

    /**
     * Check for output type support (blob or node buffer)
     */
    _checkOutputSupport() {
        this._outputType = JSZip.support.blob ? "blob" : null;
        this._outputType = JSZip.support.nodebuffer ? "nodebuffer" : null;

        if(this._outputType === null) {
            throw new Exception("No supported output type (blob, nodebuffer) detected");
        }
    }

    /**
     * Check if container files are wrapped in a folder
     */
    _checkRoot() {
        this._root = "";

        let result = this._file.file(/main\.xml$/g);
        if(result.length > 0 && result[0].name !== "main.xml") {
            this._root = result[0].name.replace("main.xml", "");
        }
    }

    /**
     * Reads the contents of a file in the X3P container
     * @param {String} filename the name of the file in the container to read
     * @param {String} type  the type of output to retrieve
     * @return {Promise} a promise that resolves to file contents of the specified type or null if the file doesn't exist
     */
    readFile(filename, type = "text") {
        let file = this.container.file(filename);
        return file === null ? null : file.async(type);
    }

    /**
     * Get a list of filenames within the container
     */
    get fileNames() {
        return Object.keys(this.container.files);
    }

    /**
     * Getter for file
     * @return {JSZip} the X3P file as a JSZip Object
     */
    get container() {
        return this._file;
    }

    /**
     * Getter for filename
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
     * Converts the X3P file into a 
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