export type DataTypeName = "Float64" | "Float32" | "Int32" | "Int16";

export type DataTypeNameLower = "float64" | "float32" | "int32" | "int16";

export type TypedArray = Float64Array | Float32Array | Int32Array | Int16Array;
export interface DataType {
    name: DataTypeName;
    bytes: number;
}

export function bufferToTypedArray(buffer: ArrayBuffer, type: DataTypeName): TypedArray {
    let result;
    
    switch(type) {
        default:
        case "Float64": result = new Float64Array(buffer); break;
        case "Float32": result = new Float32Array(buffer); break;
        case "Int32": result = new Int32Array(buffer); break;
        case "Int16": result = new Int16Array(buffer); break;
    }

    return result;
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
