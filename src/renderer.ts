import X3P from "./x3p";
import createBuffer, { GLBuffer } from "gl-buffer";
import Matrix from "./matrix";
import { mallocFloat, freeFloat } from "typedarray-pool";
import createVAO, { GLVao } from "gl-vao";
import Quad from "./quad";

interface RendererOptions {
    x3p: X3P;
    canvas: HTMLCanvasElement;
}

export default class Renderer {
    private x3p: X3P;
    private matrix: Matrix;
    private canvas: HTMLCanvasElement;
    private gl: WebGLRenderingContext; 
    private vao: GLVao;
    private coordinateBuffer: GLBuffer;
    private vertexCount: number = 0;

    constructor(options: RendererOptions) {
        this.x3p = options.x3p;
        this.matrix = this.x3p.matrix as Matrix;
        this.canvas = options.canvas;

        let context = this.canvas.getContext("webgl") || this.canvas.getContext("experimental-webgl");
        if(context === null) {
            throw new Error(`Unable to get the WebGL Rendering Context`);
        }

        this.gl = context;
        this.coordinateBuffer = createBuffer(this.gl);
        this.vao = createVAO({

        });
    }

    private buffer() {
        this.vertexCount = 0;
        let size = (this.matrix.sizeX - 1) * (this.matrix.sizeY - 1) * 6;
        size = Math.pow(2, Math.ceil(Math.log(size) / Math.log(2)));

        let coords = mallocFloat(12 * size);
        let ptr = 0;

        x: for(let x = 0; x < this.matrix.sizeX - 1; x++) {
            y: for(let y = 0; y < this.matrix.sizeY - 1; y++) {

                for(let dx = 0; dx < 2; dx++) {
                    for(let dy = 0; dy < 2; dy++) {
                        let z = this.matrix.get(1 + x + dx, 1 + y + dy, 2);
                        if(typeof z === "undefined") continue y;
                    }
                }

                for(let q = 0; q < 6; q++) {
                    let i = x + Quad[q][0];
                    let j = y + Quad[q][1];

                    let [ tx, ty, tz ] = this.matrix.get(i + 1, j + 1);
                    let [ nx, ny, nz ] = this.matrix.getNormal(i + 1, j + 1) as number[];

                    coords[ptr++] = tx;
                    coords[ptr++] = ty;
                    coords[ptr++] = (tz - this.matrix.min) / (this.matrix.max - this.matrix.min);

                    coords[ptr++] = nx;
                    coords[ptr++] = ny;
                    coords[ptr++] = nz;

                    coords[ptr++] = i / this.matrix.sizeX;
                    coords[ptr++] = j / this.matrix.sizeY;
                    
                    this.vertexCount++;
                }
            }
        }

        this.coordinateBuffer.update(coords.subarray(0, ptr));
        freeFloat(coords);
    }
}
