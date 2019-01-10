export type DataTypeName = "Float64" | "Float32" | "Int32" | "Int16";

export type DataTypeNameLower = "float64" | "float32" | "int32" | "int16";

export type TypedArray = Float64Array | Float32Array | Int32Array | Int16Array;
export interface DataType {
    name: DataTypeName;
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
