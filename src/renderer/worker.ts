import { mallocFloat, free } from "typedarray-pool";
import { TypedArray } from "../data-types";
import Quad from "./quad";

import ndarray from "ndarray";
import gradient from "ndarray-gradient";

import Axis from "axis";

const EPSILON = 0.0001;
const MULTIPLY = 5;

interface WorkerOptions {
    pointBuffer: ArrayBuffer;
    axes: { x: Axis, y: Axis, z: Axis };
}

function nextPow2(value: number) {
    return Math.pow(2, Math.ceil(Math.log(value) / Math.log(2)));
}

class WorkerUtil {
    private coords: ndarray;
    private vertexCount: number = 0;
    private elementCount: number = 0;
    
    private pointBuffer: ArrayBuffer;
    private axes: Axis[] = [];
    private dataLength: number;
    private coordBuffer?: TypedArray;
    private normals?: ndarray;

    private shape: number[];
    private lo = [ Infinity, Infinity, Infinity ];
    private hi = [ -Infinity, -Infinity, -Infinity ];

    constructor(options: WorkerOptions) {
        this.pointBuffer = options.pointBuffer;
        this.axes = [
            options.axes.x,
            options.axes.y,
            options.axes.z,
        ];

        this.shape = [ this.axes[1].size, this.axes[0].size, 3 ];
        this.dataLength = this.shape[0] * this.shape[1] * this.shape[2];
        this.coords = ndarray(mallocFloat(this.dataLength), this.shape);

        let data;
        switch(this.axes[2].name) {
            default:
            case "Float64": data = new Float64Array(this.pointBuffer); break;
            case "Float32": data = new Float32Array(this.pointBuffer); break;
            case "Int32":   data = new Int32Array(this.pointBuffer);   break;
            case "Int16":   data = new Int16Array(this.pointBuffer);   break;
        }

        const ix = this.axes[0].increment / EPSILON;
        const iy = this.axes[1].increment / EPSILON;

        this.lo = [ 0, 0, Infinity ];
        this.hi = [ this.shape[1] * iy, this.shape[0] * ix, -Infinity ];
        
        let cx = -1;
        for(let i = 0; i < data.length; i++) {
            let y = i % this.shape[1];
            let x = ((y === 0) ? ++cx : cx) % this.shape[0];

            this.coords.set(x, y, 0, y * iy);
            this.coords.set(x, y, 1, x * ix);
            this.coords.set(x, y, 2, (data[i] / EPSILON) * MULTIPLY);

            if(!isNaN(data[i]) && isFinite(data[i])) {
                this.lo[2] = Math.min(this.lo[2], data[i]);
                this.hi[2] = Math.max(this.hi[2], data[i]);
            }
        }

        data = null;
        this.computeNormals();
        this.buffer();
    }

    public dispose() {
        free(this.coordBuffer);
        free(this.coords.data);
    }

    private computeNormals() {
        let shape = [ 3, this.shape[0], this.shape[1], 2 ];
        let dfields = ndarray(mallocFloat(this.dataLength * 2), shape);

        for(let i = 0; i < 3; i++) {
            gradient(dfields.pick(i), this.coords.pick(null, null, i));
        } 

        let normals = ndarray(mallocFloat(this.dataLength * 3), this.shape);

        for(let i = 0; i < this.shape[0]; i++) {
            for(let j = 0; j < this.shape[1]; j++) {
                let dxdu = dfields.get(0, i, j, 0);
                let dxdv = dfields.get(0, i, j, 1);
                let dydu = dfields.get(1, i, j, 0);
                let dydv = dfields.get(1, i, j, 1);
                let dzdu = dfields.get(2, i, j, 0);
                let dzdv = dfields.get(2, i, j, 1);

                let nx = dydu * dzdv - dydv * dzdu;
                let ny = dzdu * dxdv - dzdv * dxdu;
                let nz = dxdu * dydv - dxdv * dydu;

                let nl = Math.sqrt(Math.pow(nx, 2) + Math.pow(ny, 2) + Math.pow(nz, 2));
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

                normals.set(i, j, 0, nx * nl);
                normals.set(i, j, 1, ny * nl);
                normals.set(i, j, 2, nz * nl);
            }
        }

        this.normals = normals;
        free(dfields.data);
    }

    private buffer() {
        this.elementCount = 0;
        this.vertexCount = 0;

        let ptr = 0;
        let count = (this.shape[0] - 1) * (this.shape[1] - 1) * 6;
        this.coordBuffer = mallocFloat(nextPow2(8 * count));

        i_loop: for(let i = 0; i < this.shape[0] - 1; i++) {
            j_loop: for(let j = 0; j < this.shape[1] - 1; j++) {
                
                // skip if any vertices in the quadrilateral are undefined
                for(let dx = 0; dx < 2; dx++) {
                    for(let dy = 0; dy < 2; dy++) {
                        let val = this.coords.get(1 + i + dx, 1 + j + dy, 2);
                        if(isNaN(val) || !isFinite(val)) continue j_loop;
                    }
                }

                let tu = (this.shape[1] - j) / this.shape[1];
                let tv = i / this.shape[0];

                for(let k = 0; k < 6; k++) {
                    let ix = i + Quad[k][0];
                    let iy = j + Quad[k][1];
                    
                    this.coordBuffer[ptr++] = this.coords.get(ix, iy, 0);
                    this.coordBuffer[ptr++] = this.coords.get(ix, iy, 1);
                    this.coordBuffer[ptr++] = this.coords.get(ix, iy, 2);

                    let normals = this.normals as ndarray;
                    this.coordBuffer[ptr++] = normals.get(ix, iy, 0);
                    this.coordBuffer[ptr++] = normals.get(ix, iy, 1);
                    this.coordBuffer[ptr++] = normals.get(ix, iy, 2);

                    this.coordBuffer[ptr++] = tu;
                    this.coordBuffer[ptr++] = tv;
                    this.vertexCount++;
                }
            }
        }
        this.elementCount = ptr;
    }

    public get result() {
        return {
            vertexCount: this.vertexCount,
            elementCount: this.elementCount,
            buffer: this.coordBuffer,
            coords: [ this.coords.data ],
            shape: [ this.coords.shape[0], this.coords.shape[1] ],
            bounds: [ this.lo, this.hi ],
        };
    }
}

self.onmessage = (e) => {
    let util = new WorkerUtil(e.data);
    // @ts-ignore
    postMessage(util.result, [ util.coordBuffer.buffer, util.coords.data.buffer ]);
};
