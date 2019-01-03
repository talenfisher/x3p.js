import Axis from "./axis";
import Manifest from "./manifest";

const $getter = Symbol();

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

    private [$getter]: any;

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
        this[$getter] = this.dataView[`get${this.dataType.name}`];
    }

    public get(x: number, y: number, axis?: number) {
        let byteOffset = this.getByteOffset(x, y);
        let byteValue;

        try {
            byteValue = this.getData(byteOffset);
            if(isNaN(byteValue) || !isFinite(byteValue)) throw new RangeError();
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
    public getCDiff(x: number, y: number, axis?: number) {
        let result = [];
        let start = typeof axis === "undefined" ? 0 : axis;
        let end = typeof axis === "undefined" ? 3 : axis + 1;

        for(let i = start; i < end; i++) {
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

        return typeof axis !== "undefined" ? result[axis] : result;
    }

    // Computes a vertex normal, adapted from 
    // the algorithm found in gl-surface3d by Mikola Lysenko
    public getNormal(x: number, y: number, axis?: number) {
        let cdiff = this.getCDiff(x, y);
        
        let dx = cdiff[0] as number[];
        let dy = cdiff[1] as number[];
        let dz = cdiff[2] as number[];

        let nx = (dy[0] * dz[1]) - (dy[1] * dz[0]);
        let ny = (dz[0] * dx[1]) - (dz[1] * dx[0]);
        let nz = (dx[0] * dy[1]) - (dx[1] - dy[0]);

        let nl = Math.sqrt((nx * nx) + (ny * ny) + (nz * nz));
        if(nl < 1e-8) {
            nl = Math.max(Math.abs(nx), Math.abs(ny), Math.abs(nz));

            if(nl < 1e-8) {
                nz = 1.0;
                ny = nx = 0.0;
                nl = 1.0;
            } else {
                nl = 1.0 / nl;
            }
        } else {
            nl = 1.0 / Math.sqrt(nl);
        }

        let result = [ nx, ny, nz ];
        return typeof axis !== "undefined" ? result[axis] : result;
    }

    public get max() {
        let max = this.getData(0);
        let current = max;

        for(let i = 1; i < this.size; i++) {
            current = this.getData(i * this.dataType.bytes);
            
            if(current > max) max = current;
        }

        return max;
    }

    public get min() {
        let min = this.getData(0);
        let current = min;

        for(let i = 1; i < this.size; i++) {
            current = this.getData(i * this.dataType.bytes);

            if(current < min) min = current;
        }

        return min;
    }

    public get size() {
        return this.x.size * this.y.size;
    }

    public get sizeX() {
        return this.x.size;
    }

    public get sizeY() {
        return this.y.size;
    }

    public getByteOffset(x: number, y: number) {
        return ((x * this.y.size) + y) * this.dataType.bytes;
    }

    private getData(offset: number) {
        return this[$getter].apply(this.dataView, [ offset ]);
    }
}
