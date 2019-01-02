import Axis from "./axis";
import Manifest from "./manifest";

interface MatrixOptions {
    axes: { x: Axis, y: Axis, z: Axis };
    manifest: Manifest;
    pointBuffer: ArrayBuffer;
}

interface DataView {
    [name: string]: any;
}

export default class Matrix {
    private manifest: Manifest;
    private pointBuffer: ArrayBuffer;
    private dataView: DataView;
    private dataType: { name: string, bytes: number };

    private x: Axis;
    private y: Axis;
    private z: Axis;

    constructor(options: MatrixOptions) {
        this.manifest = options.manifest;
        this.pointBuffer = options.pointBuffer;
        this.dataView = new DataView(this.pointBuffer);

        this.x = options.axes.x;
        this.y = options.axes.y;
        this.z = options.axes.z;
        this.dataType = this.z.dataType;
    }

    public get(x: number, y: number) {
        let byteOffset = this.getByteOffset(x, y);
        let byteValue;

        try {
            byteValue = this.dataView[`get${this.dataType.name}`](byteOffset);
            if(isNaN(byteValue)) throw new RangeError();
        } catch(error) {
            return undefined;
        }
        
        return [
            this.x.increment * x,
            this.y.increment * y,
            byteValue,
        ];
    }

    public getByteOffset(x: number, y: number) {
        return ((x * this.y.size) + y) * this.dataType.bytes;
    }
}
