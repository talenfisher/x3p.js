import X3P from "../x3p";
import Quad from "./quad";
import Identity from "./identity";
import createShader from "./shaders/index";

import createBuffer, { GLBuffer } from "gl-buffer";
import createTexture from "gl-texture2d";
import { freeFloat } from "typedarray-pool";
import createVAO, { GLVao } from "gl-vao";
import { invert, multiply } from "gl-mat4";
import LightingOptions from "./lighting";
import ndarray from "ndarray";
import { TypedArray } from "../data-types";

interface MeshOptions {
    x3p: X3P;
    canvas: HTMLCanvasElement;
    lighting?: LightingOptions;
}

const STRIDE = 4 * (3 + 3 + 2);

export default class Mesh {
    public clipBounds?: number[][] = [[0, 0, 0], [0, 0, 0]];
    public pickSlots: number = 1;
    public pickId: number = 1;
    public dirty: boolean = true;

    private coords?: ndarray;
    private shape?: number[];
    private bounds?: number[][];
    private x3p: X3P;
    private canvas: HTMLCanvasElement;
    private gl: WebGLRenderingContext; 
    private vao: GLVao;
    private texture: any;
    private coordinateBuffer: GLBuffer;
    private vertexCount: number = 0;
    private shader: any;
    private pickShader: any;

    private uniforms = {
        model: Identity,
        view: Identity,
        projection: Identity.slice(),
        inverseModel: Identity.slice(),
        ambient: 1,
        diffuse: 1,
        specular: 1,
        roughness: 1,
        fresnel: 1.5,
        lightPosition: [0, 0, 0],
        eyePosition: [0, 0, 0],
        clipBounds: this.clipBounds,
    };

    private pickUniforms = Object.assign({ pickId: this.pickId / 255.0 }, this.uniforms);

    constructor(options: MeshOptions) {

        this.x3p = options.x3p;
        this.canvas = options.canvas;
        this.gl = this.canvas.getContext("webgl") as WebGLRenderingContext;
        this.shader = createShader(this.gl);
        this.pickShader = createShader(this.gl, "pick");
        this.coordinateBuffer = createBuffer(this.gl);
        this.texture = this.x3p.mask.getTexture(this.gl);
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

        this.update(options);
    }

    public draw(options: any) {
        
        this.gl.disable(this.gl.CULL_FACE);
        this.texture.bind(0);

        let uniforms = this.uniforms;
        uniforms.model = options.model;
        uniforms.projection = options.projection;
        uniforms.view = options.view;
        uniforms.inverseModel = invert(uniforms.inverseModel, uniforms.model);
        uniforms.clipBounds = this.clipBounds as number[][]; // gl-plot3d adjusts this

        let invCameraMatrix = Identity.slice();
        multiply(invCameraMatrix, uniforms.view, uniforms.model);
        multiply(invCameraMatrix, uniforms.projection, invCameraMatrix);
        invert(invCameraMatrix, invCameraMatrix);

        let w = invCameraMatrix[15];
        for(let i = 0; i < 3; i++) {
            uniforms.eyePosition[i] = invCameraMatrix[12 + i] / invCameraMatrix[15];
            w += uniforms.lightPosition[i] * invCameraMatrix[4 * i + 3];
        }

        for(let i = 0; i < 3; i++) {
            let s = invCameraMatrix[12 + i];
            
            for(let j = 0; j < 3; j++) {
                s += invCameraMatrix[4 * j + i] * uniforms.lightPosition[j];
            }

            uniforms.lightPosition[i] = s / w;
        }
        
        this.shader.bind();
        this.shader.uniforms = uniforms;

        this.vao.bind();
        this.vao.draw(this.gl.TRIANGLES, this.vertexCount); 
        this.vao.unbind();
    }

    public drawPick(options: any) {
        let uniforms = this.pickUniforms;
        uniforms.model = options.model || Identity;
        uniforms.view = options.view || Identity;
        uniforms.projection = options.projection || Identity;
        uniforms.pickId = this.pickId / 255.0;
        
        this.pickShader.bind();
        this.pickShader.uniforms = uniforms;

        this.vao.bind();
        this.vao.draw(this.gl.TRIANGLES, this.vertexCount);
        this.vao.unbind();
    }

    public update(options?: MeshOptions) {
        let worker = new Worker("./worker.ts");

        // update lighting uniforms
        if(options && options.lighting) {
            let lighting = options.lighting;
            Object.assign(this.uniforms, lighting);
        } 

        // @ts-ignore
        worker.postMessage({ 
            pointBuffer: this.x3p.pointBuffer,
            axes: {
                x: this.x3p.axes.x.cache(),
                y: this.x3p.axes.y.cache(),
                z: this.x3p.axes.z.cache(),
            },
        }, [ this.x3p.pointBuffer as ArrayBuffer ]);

        worker.onmessage = (e) => {
            this.vertexCount = e.data.vertexCount;
            this.coordinateBuffer.update(e.data.buffer.subarray(0, e.data.elementCount));
            this.shape = e.data.shape;
            this.bounds = e.data.bounds;
            this.dirty = true;
            this.coords = ndarray(e.data.coords, this.shape);
            
            freeFloat(e.data.buffer);
            worker.terminate();
        };
    }

    public pick(selection: any) {
        if(!selection || selection.id !== this.pickId) return;

        let shape = this.shape as number[];
        let coords = this.coords as ndarray;
        
        let result = {
            position: [ 0, 0, 0],
            index: [ 0, 0 ],
            uv: [ 0, 0 ],
            dataCoordinate: [ 0, 0, 0 ],
        };

        let x = shape[0] * (selection.value[0] + (selection.value[2] >> 4) / 16.0) / 255.0;
        let ix = Math.floor(x);
        let fx = x - ix;
      
        let y = shape[1] * (selection.value[1] + (selection.value[2] & 15) / 16.0) / 255.0;
        let iy = Math.floor(y);
        let fy = y - iy;

        ix++;
        iy++;

        let pos = result.position;
        for(let dx = 0; dx < 2; dx++) {
            let s = dx ? fx : 1.0 - fx;
            
            for(let dy = 0; dy < 2; dy++) {
                let t = dy ? fy : 1.0 - fy;
            
                let r = ix + dx;
                let c = iy + dy;
                let w = s * t;
            
                for(let i = 0; i < 3; i++) {
                    pos[i] += coords.get(r, c, i) * w;
                }
            }
        }

        result.index[0] = fx < 0.5 ? ix : (ix + 1);
        result.index[1] = fy < 0.5 ? iy : (iy + 1);

        result.uv[0] = x / shape[0];
        result.uv[1] = y / shape[1];

        for(let i = 0; i < 3; i++) {
            result.dataCoordinate[i] = coords.get(result.index[0], result.index[1], i);
        }

        return result;
    }

    public setPickBase(base: number) {
        this.pickId = base;
    }

    public isOpaque() {
        return true;
    }
}
