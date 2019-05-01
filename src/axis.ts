import DataTypes, { DataType } from "./data-types";
import Manifest from "./manifest";

const DataTypeKeys = Object.keys(DataTypes);

export interface AxisOptions {
    name: "X" | "Y" | "Z";
    manifest: Manifest;
}

/**
 * Class for accessing axis information in the X3P
 * 
 * @author Talen Fisher
 */
export default class Axis {  
    
    /**
     * The Axis name
     */
    public readonly name: string;

    /**
     * The Axis definition in the manifest
     */
    private definition: Element;

    /**
     * Manifest to read axis information from
     */
    private manifest: Manifest;

    /**
     * Construct a new Axis
     * 
     * @param param0 axis options - must contain the name of the axis and manifest where its data can be found.
     */
    constructor({ name, manifest }: AxisOptions) {
        let node = manifest.getNode(`Record1 Axes C${name}`);
        if(!node) {
            throw new Error(`Axis '${name}' is not defined in the manifest`);
        }

        this.name = name;
        this.definition = node;
        this.manifest = manifest;
    }

    /**
     * Get the axis increment
     */
    get increment(): number {
        let el = this.definition.querySelector(`Increment`);
        return el !== null ? Number(el.innerHTML) : 0;
    }

    /**
     * Get the axis' data type
     */
    get dataType(): DataType {
        let el = this.definition.querySelector(`DataType`);
        
        if(el === null || !DataTypeKeys.includes(el.innerHTML as string)) {
            let received = el ? el.innerHTML : "null";
            throw new Error(`'${received}' is not a valid data type`);
        }

        return DataTypes[(el.innerHTML as string).toUpperCase() as "D" | "F" | "L" | "I"];
    }

    /**
     * Get the axis' size
     */
    get size() {
        let value = this.manifest.get(`Record3 MatrixDimension Size${this.name}`);
        return value || 0;
    }

    /**
     * Get an object with static axis values
     */
    get values() {
        return {
            increment: this.increment,
            dataType: this.dataType,
            size: this.size,
        } as Axis;
    }
}
