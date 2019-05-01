import { TypedArray } from "../../data-types";
import createQuad from "./quad";

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
    decimationFactor?: number;
}

/**
 * Worker utility for building a mesh from X3P point data
 * 
 * @author Talen Fisher
 */
class WorkerUtil {

    /**
     * X3P coordinates read from the point buffer
     */
    private coords?: ndarray;

    /**
     * Coordinate buffer, containing vertex coordinates, normals and texture coordinates
     */
    private coordBuffer?: TypedArray;

    /**
     * The origin point to start reading from
     */
    private origin: string;

    /**
     * Number of vertices in the mesh
     */
    private vertexCount: number = 0;

    /**
     * Number of elements in the coordinate buffer
     */
    private elementCount: number = 0;

    /**
     * The source point buffer to read data from
     */
    private pointBuffer: ArrayBuffer;

    /**
     * Axes information for the X3P
     */
    private axes: Axis[] = [];

    /**
     * Total number of coordinates
     */
    private dataLength: number;
    
    /**
     * Gradient of the mesh using central differences, used for computing normals
     */
    private gradient?: ndarray;

    /**
     * Decimation factor, ends up controlling how many vertices are skipped
     */
    private decimationFactor: number;

    /**
     * The shape of the mesh in terms of x, y, z
     */
    private shape: number[];

    /**
     * Lower bounds in terms of x, y, z
     */
    private lo = [ Infinity, Infinity, Infinity ];

    /**
     * Upper bounds in terms of x, y, z
     */
    private hi = [ -Infinity, -Infinity, -Infinity ];

    /**
     * Constructs a new Worker Util
     * 
     * @param options options to use for the workerutil
     */
    constructor(options: WorkerOptions) {
        this.pointBuffer = options.pointBuffer;
        this.origin = options.origin;
        this.decimationFactor = options.decimationFactor || 0;
        this.axes = [
            options.axes.x,
            options.axes.y,
            options.axes.z,
        ];

        this.shape = [ this.axes[0].size as number, this.axes[1].size as number, 3 ];
        this.dataLength = this.shape[0] * this.shape[1] * this.shape[2];
        this.coords = ndarray(new Float32Array(this.dataLength), this.shape);

        let name = this.axes[2].dataType.name || "d";
        let type = dtype(name);
        
        if(!type) {
            throw new Error(`Could not find data type '${type}'`);
        }

        let data = new (type as any)(this.pointBuffer);
        const ix = this.axes[0].increment / EPSILON;
        const iy = this.axes[1].increment / EPSILON;
        
        const pox = this.origin[1].toLowerCase();
        const poy = this.origin[0].toLowerCase();

        const ox = pox === "e" ? 0 : this.shape[0];
        const oy = poy === "n" ? 0 : this.shape[1];

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

    /**
     * Setup the gradient to use for computing normals
     */
    private setupGradient() {
        let shape = [ 3, this.shape[0], this.shape[1], 2 ];
        let coords = this.coords as ndarray;
        this.gradient = ndarray(new Float32Array(this.dataLength * 2), shape);

        for(let i = 0; i < 3; i++) {
            gradient(this.gradient.pick(i), coords.pick(null, null, i));
        }
    }

    /**
     * Get the normal for a coordinate
     * 
     * @param x x-component of the coordinate to get a normal for
     * @param y y-component of the coordinate to get a normal for
     */
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
 
    /**
     * Compute coordinates, normals and texture coordinates, store in the coordBuffer
     */
    private buffer() {
        let stride = this.stride;
        let coords = this.coords as ndarray;
        let quad = createQuad(stride);
        let ptr = 0;
        let iUpperBound = this.shape[0] - stride;
        let jUpperBound = this.shape[1] - stride;
        let verticesPerQuad = quad.length;
        let count = iUpperBound * jUpperBound * verticesPerQuad;
        let bufferSize = 8 * count;

        this.setupGradient();
        this.elementCount = 0;
        this.vertexCount = 0;
        this.coordBuffer = new Float32Array(bufferSize);        

        i_loop: for(let i = 0; i < iUpperBound; i += stride) {
            j_loop: for(let j = 0; j < jUpperBound; j += stride) {
                 
                // skip if any vertices in the quadrilateral are undefined
                for(let dx = 0; dx <= stride; dx++) {
                    for(let dy = 0; dy <= stride; dy++) {
                        let val = coords.get(1 + i + dx, 1 + j + dy, 2);
                        if(isNaN(val) || !isFinite(val)) continue j_loop;
                    }
                }

                let tu = i / this.shape[0];
                let tv = j / this.shape[1];
                
                for(let k = 0; k < verticesPerQuad; k++) {
                    let ix = i + quad[k][0];
                    let iy = j + quad[k][1];
                    
                    this.coordBuffer[ptr++] = coords.get(ix, iy, 0);
                    this.coordBuffer[ptr++] = coords.get(ix, iy, 1);
                    this.coordBuffer[ptr++] = coords.get(ix, iy, 2);

                    let normal = this.getNormal(ix, iy) as number[];
                    this.coordBuffer[ptr++] = normal[0];
                    this.coordBuffer[ptr++] = normal[1];
                    this.coordBuffer[ptr++] = normal[2];

                    this.coordBuffer[ptr++] = tu;
                    this.coordBuffer[ptr++] = tv;
                    this.vertexCount++;
                }
            }

            postMessage({ 
                progress: i / this.shape[0],
            });
        }

        this.elementCount = ptr;
    }

    /**
     * Get the result from buffer()
     */
    public get result() {
        let coords = this.coords as ndarray;

        return {
            vertexCount: this.vertexCount,
            elementCount: this.elementCount,
            buffer: this.coordBuffer,
            shape: [ coords.shape[0], coords.shape[1] ],
            bounds: [ this.lo, this.hi ],
        };
    }

    /**
     * Compute the stride from the decimation factor
     */
    private get stride() {
        let decimationFactor = this.decimationFactor;
        decimationFactor = Math.max(0, decimationFactor);
        decimationFactor = Math.min(decimationFactor, 1);

        let coords = this.coords as ndarray;
        let shape = coords.shape;
        let sx = shape[0];
        let sy = shape[1];
        let avg = (sx + sy) / 2;
        let max = Math.floor(avg / 200);

        return 1 + Math.floor(decimationFactor * max);
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
