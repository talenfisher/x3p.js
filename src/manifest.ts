import Node from "./node";

const AxesDescriptionType = {
    AxisType: new Node({
        type: "enum",
        values: ["A", "I"]
    }),

    DataType: new Node({
        type: "enum",
        values: ["I", "L", "F", "D"]
    }),

    Incremment: new Node({
        type: "float"
    }),

    Offset: new Node({
        type: "int"
    })
};

export default class Manifest {
    public Record1 = {
        
        Revision: new Node({
            type: "string"
        }),

        FeatureType: new Node({
            type: "enum",
            values: ["PRF", "SUR", "PCL"]
        }),

        Axes: {
            CX: Object.assign({}, AxesDescriptionType),
            CY: Object.assign({}, AxesDescriptionType),
            CZ: Object.assign({}, AxesDescriptionType)
        }
    };
}

