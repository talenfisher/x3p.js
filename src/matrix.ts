import Axis from "./axis";
import Manifest from "./manifest";

interface MatrixOptions {
    axes: { x: Axis, y: Axis, z: Axis };
    pointBuffer: ArrayBuffer;
}

interface DataView {
    [name: string]: any;
}

export default class Matrix {
    public readonly min: number;
    public readonly max: number;

    public readonly x: Axis;
    public readonly y: Axis;
    public readonly z: Axis;

    private pointBuffer: ArrayBuffer;
    private dataView: any;
    private dataType: { name: string, bytes: number };

    constructor(options: MatrixOptions) {
        this.pointBuffer = options.pointBuffer;

        this.x = options.axes.x;
        this.y = options.axes.y;
        this.z = options.axes.z;

        this.dataType = this.z.dataType;
        this.constructView();
        
        let max, min, current;        
        min = max = current = this.dataView[0];
        for(let i = 1; i < this.dataView.length; i++) {
            current = this.dataView[i];
            
            if(current > max) max = current;
            if(current < min) min = current;
        }

        this.min = min;
        this.max = max;
    }

    public get(x: number, y: number, axis?: number) {
        let offset = (x * this.y.size) + y;
        let value;

        try {
            value = this.dataView[offset];
            if(isNaN(value) || !isFinite(value)) throw new RangeError();
        } catch(error) {
            return undefined;
        }

        let result = [
            this.x.increment * x,
            this.y.increment * y,
            value,
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
                let right = this.get(x + 1, y, i) as number;
                let left = this.get(x - 1, y, i) as number;

                dx = isNaN(right) || isNaN(left) ? 0.0 : (right - left) / 2;
            }

            if(x % this.x.size !== 0) {
                let right = this.get(x, y + 1, i) as number;
                let left = this.get(x, y - 1, i) as number;

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

    public get size() {
        return this.x.size * this.y.size;
    }

    public constructView() {
        let result;

        switch(this.dataType.name) {
            case 'Float64': result = new Float64Array(this.pointBuffer); break;
            case 'Float32': result = new Float32Array(this.pointBuffer); break;
            case 'Int32': result = new Int32Array(this.pointBuffer); break;
            case 'Int16': result = new Int16Array(this.pointBuffer); break;
            default: break;
        }

        this.dataView = result;
    }
}
