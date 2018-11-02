import { EventEmitter } from "events";
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
        this.name = name;

        if(file !== null) {
            this._file.loadAsync(file);
            return;
        }

        // TODO: add defaults for each file
        this._file.file("main.xml", "");
        this._file.file("bindata/data.bin", "");
        this._file.file("md5checksum.hex", "");

        this.checkOutputSupport();
    }

    /**
     * Check for output type support (blob or node buffer)
     */
    checkOutputSupport() {
        this._outputType = JSZip.support.blob ? "blob" : null;
        this._outputType = JSZip.support.nodebuffer ? "nodebuffer" : null;

        if(this._outputType === null) {
            throw new Exception("No supported output type (blob, nodebuffer) detected");
        }
    }

    /**
     * Getter for file
     * @return {JSZip} the X3P file as a JSZip Object
     */
    get container() {
        return this._file;
    }
}