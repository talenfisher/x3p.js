import DataTypes, { DataType } from "./data-types";
import Manifest from "./manifest";

const DataTypeKeys = Object.keys(DataTypes);

export interface AxisOptions {
    name: "X" | "Y" | "Z";
    manifest: Manifest;
}

export default class Axis {    
    public name: string;
    private definition: Element;
    private manifest: Manifest;

    constructor({ name, manifest }: AxisOptions) {
        let node = manifest.getNode(`Record1 Axes C${name}`);
        if(!node) {
            throw new Error(`Axis '${name}' is not defined in the manifest`);
        }

        this.name = name;
        this.definition = node;
        this.manifest = manifest;
    }

    get increment() {
        let el = this.definition.querySelector(`Increment`);
        return el !== null ? Number(el.innerHTML) : 0;
    }

    get dataType(): DataType {
        let el = this.definition.querySelector(`DataType`);
        
        if(el === null || !DataTypeKeys.includes(el.innerHTML as string)) {
            let received = el ? el.innerHTML : "null";
            throw new Error(`'${received}' is not a valid data type`);
        }

        return DataTypes[(el.innerHTML as string).toUpperCase() as "D" | "F" | "L" | "I"];
    }

    get size() {
        let value = this.manifest.get(`Record3 MatrixDimension Size${this.name}`);
        return value || 0;
    }

    get values() {
        return {
            increment: this.increment,
            dataType: this.dataType,
            size: this.size,
        } as Axis;
    }
}
