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

    public get(x: number, y: number, axis?: number) {
        let byteOffset = this.getByteOffset(x, y);
        let byteValue;

        try {
            byteValue = this.dataView[`get${this.dataType.name}`](byteOffset);
            if(isNaN(byteValue)) throw new RangeError();
        } catch(error) {
            return undefined;
        }

        let result = [
            this.x.increment * x,
            this.y.increment * y,
            byteValue,
        ];
        
        return typeof axis !== "undefined" ? result[axis] : result;
    }
    
    // computes central difference
    public getCDiff(x: number, y: number, axis: number) {
        let result = [];

        for(let i = 0; i < 3; i++) {
            let dx = 0.0;
            let dy = 0.0;

            if(y % this.y.size !== 0) { 
                let right = this.get(x + 1, y, i);
                let left = this.get(x - 1, y, i);

                dx = isNaN(right) || isNaN(left) ? 0.0 : (right - left) / 2;
            }

            if(x % this.x.size !== 0) {
                let right = this.get(x, y + 1, i);
                let left = this.get(x, y - 1, i);

                dy = isNaN(right) || isNaN(left) ? 0.0 : (right - left) / 2;
            }

            result[i] = [ dx, dy ];
        }

        return typeof result !== "undefined" ? result[axis] : result;
    }

    public getByteOffset(x: number, y: number) {
        return ((x * this.y.size) + y) * this.dataType.bytes;
    }
}
