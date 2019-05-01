/**
 * Any typed array
 */
export type TypedArray = Float64Array | Float32Array | Int32Array | Int16Array;

/**
 * An Axis data type 
 */
export interface DataType {
    /**
     * Name of the data type
     */
    name: "Float64" | "Float32" | "Int32" | "Int16";

    /**
     * Number of bytes in the data type
     */
    bytes: number;
}

export default {
    D: { 
        name: "Float64", 
        bytes: 8,
    } as DataType,

    F: { 
        name: "Float32", 
        bytes: 4,
    } as DataType,
    
    L: { 
        name: "Int32", 
        bytes: 4,
    } as DataType,
    I: { 
        name: "Int16", 
        bytes: 2,
    } as DataType,
};
