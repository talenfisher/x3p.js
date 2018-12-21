import DataTypes from "./data-types";

const DataTypeKeys = Object.keys(DataTypes);

export interface AxisOptions {
    name: "X" | "Y" | "Z";
    manifest: Document;
}

export default class Axis {    
    public name: string;
    private definition: Element;
    private manifest: Document;

    constructor({ name, manifest }: AxisOptions) {
        let root = manifest.querySelector(`Record1 Axes C${name}`);
        
        if(root === null) {
            throw new Error(`Axis '${name}' is not defined in the manifest`);
        }

        this.name = name;
        this.definition = root;
        this.manifest = manifest;
    }

    get increment() {
        let el = this.definition.querySelector(`Increment`);
        return el !== null ? Number(el.innerHTML) : 0;
    }

    get dataType() {
        let el = this.definition.querySelector(`DataType`);
        
        if(el === null || !DataTypeKeys.includes(<string> el.innerHTML)) {
            throw new Error(`'${el ? el.innerHTML : "null"}' is not a valid data type`);
        }

        return DataTypes[< "D" | "F" | "L" | "I"> (<string> el.innerHTML).toUpperCase()];
    }

    get size() {
        let el = this.manifest.querySelector(`Record3 MatrixDimension Size${this.name}`);
        return el !== null ? Number(el.innerHTML) : 0;
    }
}
