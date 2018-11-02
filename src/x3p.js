import JSZip from "jszip";

export default class X3P {
    /**
     * 
     * @param {File|null} file optional file to load
     * @param {*} name 
     */
    constructor(file = null, name = null) {
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
    }

    /**
     * Getter for file
     * @return {JSZip} the X3P file as a JSZip Object
     */
    get container() {
        return this._file;
    }
}