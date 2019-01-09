import Axis from "./axis";

interface MatrixOptions {
    axes: { x: Axis, y: Axis, z: Axis };
    pointBuffer: ArrayBuffer;
    epsilon?: number;
}

interface DataView {
    [name: string]: any;
}

function isNumeric(value: string | number) {
    return !isNaN(value as number) && isFinite(value as number);
}

export default class Matrix {
    public readonly min: number;
    public readonly max: number;

    public readonly x: Axis;
    public readonly y: Axis;
    public readonly z: Axis;

    private epsilon = 1;
    private pointBuffer: ArrayBuffer;
    private dataView: DataView;
    private dataType: { name: string, bytes: number };
    private dataGetter: any;

    constructor(options: MatrixOptions) {
        this.pointBuffer = options.pointBuffer;

        this.x = options.axes.x;
        this.y = options.axes.y;
        this.z = options.axes.z;

        this.epsilon = options.epsilon || this.epsilon;
        this.dataType = this.z.dataType;
        this.dataView = new DataView(this.pointBuffer);
        this.dataGetter = this.dataView[`get${this.dataType.name}`];
        
        let max, min, current;        
        min = max = current = this.getDataAt(0, 0);

        for(let x = 1; x < this.x.size; x++) {
            for(let y = 0; y < this.y.size; y++) {
                current = this.getDataAt(x, y);
                if(current > max) max = current;
                if(current < min) min = current;
            }
        }

        this.min = min;
        this.max = max;
    }

    public get(x: number, y: number, axis?: number) {
        let value;

        try {
            value = this.getDataAt(x, y);
            if(!isNumeric(value)) throw new RangeError();
        } catch(error) {
            return undefined;
        }

        let result = [
            (this.x.increment / this.epsilon) * x,
            (this.y.increment / this.epsilon) * y,
            (value / this.epsilon) * 5,
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

            if(x % this.x.size !== 0) { 
                let right = this.get(x + 1, y, i) as number;
                let left = this.get(x - 1, y, i) as number;

                dx = !isNumeric(right) || !isNumeric(left) ? 0.0 : (right - left) / 2;
            }

            if(y % this.y.size !== 0) {
                let right = this.get(x, y + 1, i) as number;
                let left = this.get(x, y - 1, i) as number;

                dy = !isNumeric(right) || !isNumeric(left) ? 0.0 : (right - left) / 2;
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

    public get size() {
        return this.x.size * this.y.size;
    }

    public getDataAt(x: number, y: number) {
        let offset = this.getByteOffset(x, y);
        return this.dataGetter.apply(this.dataView, [ offset ]);
    }

    private getByteOffset(x: number, y: number) {
        return ((x * this.y.size) + y) * this.dataType.bytes;
    }
}
