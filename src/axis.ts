import { Element, ElementTree } from "elementtree";
import DataTypes from "./data-types";

const DataTypeKeys = Object.keys(DataTypes);

export interface AxisOptions {
    name: "X" | "Y" | "Z";
    manifest: ElementTree;
}

export default class Axis {    
    public name: string;
    private definition: Element;
    private manifest: ElementTree;

    constructor({ name, manifest }: AxisOptions) {
        let root = manifest.find(`./Record1/Axes/C${name}`);
        if(root === null) throw new Error(`Axis '${name}' is not defined in the manifest`);

        this.name = name;
        this.definition = root;
        this.manifest = manifest;
    }

    get increment() {
        let el = this.definition.find(`./Increment`);
        return el !== null ? Number(el.text) : 0;
    }

    get dataType() {
        let el = this.definition.find(`./DataType`);
        
        if(el === null || !DataTypeKeys.includes(<string> el.text)) {
            throw new Error(`'${el ? el.text : "null"}' is not a valid data type`);
        }

        return DataTypes[< "D" | "F" | "L" | "I"> (<string> el.text).toUpperCase()];
    }

    get size() {
        let el = this.manifest.find(`./Record3/MatrixDimension/Size${this.name}`);
        return el !== null ? Number(el.text) : 0;
    }
}
