import DATA_TYPES from "./datatypes";

const AXES = ["x", "y", "z"];

export default class Matrix {
    constructor({ manifest, data }) {
        this._manifest = manifest;
        this._data = data;
        this._sizes = {};
        this._types = {};
    }

    /**
     * Checks for valid options and sets up properties
     */
    _bootstrap() {
        this._checkAxes();
    }

    /**
     * Sets up variables that are dependent on axes
     */
    _checkAxes() {
        for(let axis of AXES) {
            this._checkSize(axis);
            this._checkType(axis);
        }
    }

    /**
     * Checks for and sets up axis size variables
     */
    _checkSize(axis) {
        let 
            xpath = `./Record3/MatrixDimension/Size${axis.toUpperCase()}`,
            value = this._manifest.getInt(xpath);

        if(value === null) {
            throw new Error(`'${xpath}' Missing from Manifest`);
        }

        this._sizes[axis] = value;
    }

    /**
     * Checks for and sets up data types
     */
    _checkType(axis) {
        let 
            xpath = `./Record1/Axes/C${axis.toUpperCase()}/DataType`,
            value = this._manifest.get(xpath);
        
        if(value === null) {
            throw new Error(`'${xpath}' Missing from Manifest`);
        }

        value = value.toUpperCase();
        if(!(value in DATA_TYPES)) {
            throw new Error(`Unknown Data Type '${value}'`);
        }

        this._types[axis] = DATA_TYPES[value];
    }
}