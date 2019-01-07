import X3P from "../x3p";
import Matrix from "../matrix";
import Quad from "./quad";
import Identity from "./identity";
import createShader from "./shaders/index";

import createBuffer, { GLBuffer } from "gl-buffer";
import { mallocFloat, freeFloat } from "typedarray-pool";
import createVAO, { GLVao } from "gl-vao";

interface MeshOptions {
    x3p: X3P;
    canvas: HTMLCanvasElement;
}

const STRIDE = 4 * (3 + 3 + 2);

export default class Mesh {

    private x3p: X3P;
    private matrix: Matrix;
    private canvas: HTMLCanvasElement;
    private gl: WebGLRenderingContext; 
    private vao: GLVao;
    private coordinateBuffer: GLBuffer;
    private vertexCount: number = 0;
    private shader: any;
    private camera: any;

    private uniforms = {
        model: Identity,
        view: Identity,
        projection: Identity,
    };

    constructor(options: MeshOptions) {
        this.x3p = options.x3p;
        this.matrix = this.x3p.matrix as Matrix;
        this.canvas = options.canvas;

        let context = this.canvas.getContext("webgl") || this.canvas.getContext("experimental-webgl");
        if(context === null) {
            throw new Error(`Unable to get the WebGL Rendering Context`);
        }

        this.gl = context;
        this.shader = createShader(this.gl);
        this.coordinateBuffer = createBuffer(this.gl);
        this.vao = createVAO(this.gl, [
            {
                buffer: this.coordinateBuffer,
                size: 3,
                stride: STRIDE,
                offset: 0,
            },
            {
                buffer: this.coordinateBuffer,
                size: 3,
                stride: STRIDE,
                offset: 12,
            },
            {
                buffer: this.coordinateBuffer,
                size: 2,
                stride: STRIDE,
                offset: 24,
            },
        ]);


        this.update();
    }

    public draw(options: any) {
        let uniforms = this.uniforms;
        uniforms.model = options.model || Identity;
        uniforms.projection = options.projection || Identity;
        uniforms.view = options.view || Identity;

        this.shader.bind();
        this.shader.uniforms = uniforms;

        this.vao.bind();
        this.vao.draw(this.gl.TRIANGLES, this.vertexCount); 
        this.vao.unbind();
    }

    public update() {
        this.vertexCount = 0;
        
        let min = this.matrix.min;
        let max = this.matrix.max;
        let diff = max - min;

        let sx = this.matrix.x.size - 1;
        let sy = this.matrix.y.size - 1;
        let size = sx * sy * 6;
        size = Math.pow(2, Math.ceil(Math.log(size) / Math.log(2)));

        let coords = mallocFloat(8 * size);
        let ptr = 0;

        xLoop: for(let x = 0; x < sx; x++) {
            yLoop: for(let y = 0; y < sy; y++) {

                for(let dx = 0; dx < 2; dx++) {
                    for(let dy = 0; dy < 2; dy++) {
                        let z = this.matrix.get(1 + x + dx, 1 + y + dy, 2);
                        if(typeof z === "undefined") continue yLoop;
                    }
                }

                for(let q = 0; q < 6; q++) {
                    let i = x + Quad[q][0];
                    let j = y + Quad[q][1];

                    let vertex = this.matrix.get(i + 1, j + 1) as number[];
                    let normal = this.matrix.getNormal(i + 1, j + 1) as number[];

                    coords[ptr++] = vertex[0];
                    coords[ptr++] = vertex[1];
                    coords[ptr++] = (vertex[2] - min) / diff;

                    coords[ptr++] = normal[0];
                    coords[ptr++] = normal[1];
                    coords[ptr++] = normal[2];

                    coords[ptr++] = i / (sx + 1);
                    coords[ptr++] = j / (sy + 1);
                    
                    this.vertexCount++;
                }
            }
        }

        this.coordinateBuffer.update(coords.subarray(0, ptr));
        freeFloat(coords);
    }

    public isOpaque() {
        return true;
    }
}
