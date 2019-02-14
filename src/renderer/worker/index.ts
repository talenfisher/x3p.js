import { mallocFloat, free } from "typedarray-pool";
import { TypedArray } from "../../data-types";
import Quad from "./quad";

import dtype from "@talenfisher/dtype";
import ndarray from "ndarray";
import gradient from "ndarray-gradient";

import Axis from "../../axis";

const EPSILON = 0.0001;
const MULTIPLY = 5;

interface WorkerOptions {
    pointBuffer: ArrayBuffer;
    axes: { x: Axis, y: Axis, z: Axis };
    origin: string;
}

function nextPow2(value: number) {
    return Math.pow(2, Math.ceil(Math.log(value) / Math.log(2)));
}

class WorkerUtil {
    private coords: ndarray;
    private origin: string;
    private vertexCount: number = 0;
    private elementCount: number = 0;
    private pointBuffer: ArrayBuffer;
    private axes: Axis[] = [];
    private dataLength: number;
    private coordBuffer?: TypedArray;
    private gradient?: ndarray;

    private shape: number[];
    private lo = [ Infinity, Infinity, Infinity ];
    private hi = [ -Infinity, -Infinity, -Infinity ];

    constructor(options: WorkerOptions) {
        this.pointBuffer = options.pointBuffer;
        this.origin = options.origin;
        this.axes = [
            options.axes.x,
            options.axes.y,
            options.axes.z,
        ];

        this.shape = [ this.axes[0].size, this.axes[1].size, 3 ];
        this.dataLength = this.shape[0] * this.shape[1] * this.shape[2];
        this.coords = ndarray(mallocFloat(this.dataLength), this.shape);

        let name = this.axes[2].dataType.name || "d";
        let type = dtype(name);
        
        if(!type) {
            throw new Error(`Could not find data type '${type}'`);
        }

        let data = new (type as any)(this.pointBuffer);
        const ix = this.axes[0].increment / EPSILON;
        const iy = this.axes[1].increment / EPSILON;
        
        const pox = this.origin[0].toLowerCase();
        const poy = this.origin[1].toLowerCase();

        const ox = pox === "s" ? 0 : this.shape[0];
        const oy = poy === "w" ? 0 : this.shape[1];

        this.lo = [ 0, 0, Infinity ];
        this.hi = [ this.shape[0] * ix, this.shape[1] * iy, -Infinity ];
        
        let cv = -1;
        for(let i = 0; i < data.length; i++) {
            const u = i % this.shape[0];
            const v = ((u === 0) ? ++cv : cv) % this.shape[1];
            
            const x = Math.abs(ox - u) * ix;
            const y = Math.abs(oy - v) * iy;
            const z = (data[i] / EPSILON) * MULTIPLY;

            this.coords.set(u, v, 0, x);
            this.coords.set(u, v, 1, y);
            this.coords.set(u, v, 2, z);

            if(!isNaN(data[i]) && isFinite(data[i])) {
                this.lo[2] = Math.min(this.lo[2], data[i]);
                this.hi[2] = Math.max(this.hi[2], data[i]);
            }
        }
        
        this.buffer();
    }

    public dispose() {
        free(this.coordBuffer);
        free(this.coords.data);
    }

    private setupGradient() {
        let shape = [ 3, this.shape[0], this.shape[1], 2 ];
        this.gradient = ndarray(mallocFloat(this.dataLength * 2), shape);

        for(let i = 0; i < 3; i++) {
            gradient(this.gradient.pick(i), this.coords.pick(null, null, i));
        }
    }

    private getNormal(x: number, y: number) {
        if(!this.gradient) return;

        let dxdu = this.gradient.get(0, x, y, 0);
        let dxdv = this.gradient.get(0, x, y, 1);
        let dydu = this.gradient.get(1, x, y, 0);
        let dydv = this.gradient.get(1, x, y, 1);
        let dzdu = this.gradient.get(2, x, y, 0);
        let dzdv = this.gradient.get(2, x, y, 1);

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

        return [ 
            nx * nl, 
            ny * nl, 
            nz * nl,
        ];
    }

    private buffer() {
        this.setupGradient();

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

                let tu = i / this.shape[0];
                let tv = j / this.shape[1];
                
                for(let k = 0; k < 6; k++) {
                    let ix = i + Quad[k][0];
                    let iy = j + Quad[k][1];
                    
                    this.coordBuffer[ptr++] = this.coords.get(ix, iy, 0);
                    this.coordBuffer[ptr++] = this.coords.get(ix, iy, 1);
                    this.coordBuffer[ptr++] = this.coords.get(ix, iy, 2);

                    let normal = this.getNormal(ix, iy) as number[];
                    this.coordBuffer[ptr++] = normal[0];
                    this.coordBuffer[ptr++] = normal[1];
                    this.coordBuffer[ptr++] = normal[2];

                    this.coordBuffer[ptr++] = tu;
                    this.coordBuffer[ptr++] = tv;
                    this.vertexCount++;
                }
            }

            postMessage({ progress: i / this.shape[0] });
        }

        this.elementCount = ptr;
        
        let grad = this.gradient as ndarray;
        free(grad.data);
    }

    public get result() {
        return {
            vertexCount: this.vertexCount,
            elementCount: this.elementCount,
            buffer: this.coordBuffer,
            shape: [ this.coords.shape[0], this.coords.shape[1] ],
            bounds: [ this.lo, this.hi ],
        };
    }
}

onmessage = (e) => {
    let util = new WorkerUtil(e.data);
    
    let result = util.result;
    let message = Object.assign({ progress: 1 }, result);
    let transferables = [
        (result.buffer as TypedArray).buffer,
    ];
    
    postMessage(message, transferables);
    close();
};
