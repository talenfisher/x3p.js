import X3P from "../x3p";
import Identity from "./identity";
import createShader from "./shaders/index";
import Renderer from "./index";

import createBuffer, { GLBuffer } from "gl-buffer";
import { freeFloat } from "typedarray-pool";
import createVAO, { GLVao } from "gl-vao";
import { invert, multiply } from "gl-mat4";
import LightingOptions from "./lighting";

interface MeshOptions {
    x3p: X3P;
    renderer: Renderer;
    canvas: HTMLCanvasElement;
    lighting?: LightingOptions;
}

const STRIDE = 4 * (3 + 3 + 2);

/**
 * This mesh is compatible with gl-plot3d, and is based off of
 * gl-vis/gl-plot3d.  It has been modified to use less memory and
 * not block the UI thread while building vertices.  Point picking
 * now only occurs when the renderer is in "still" mode
 */

export default class Mesh {
    public clipBounds?: number[][] = [[0, 0, 0], [0, 0, 0]];
    public pickId: number = 1;
    public dirty: boolean = false;
    public ready: boolean = false;
    public highlightColor?: number[];
    public bounds?: number[][];
    public onready?: any;

    private renderer: Renderer;
    private shape?: number[];
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
        highlight: false,
        highlightColor: [0, 0, 0],
        ambient: 1,
        diffuse: 1,
        specular: 1,
        roughness: 1,
        fresnel: 1.5,
        lightPosition: [0, 0, 0],
        eyePosition: [0, 0, 0],
        clipBounds: this.clipBounds,
    };

    private pickUniforms = Object.assign({}, this.uniforms);

    constructor(options: MeshOptions) {
        this.x3p = options.x3p;
        this.renderer = options.renderer;
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
        if(!this.ready) return;

        this.gl.disable(this.gl.CULL_FACE);
        this.texture.bind(0);

        let uniforms = this.uniforms;
        uniforms.model = options.model;
        uniforms.projection = options.projection;
        uniforms.view = options.view;
        uniforms.inverseModel = invert(uniforms.inverseModel, uniforms.model);
        uniforms.clipBounds = this.clipBounds as number[][]; // gl-plot3d adjusts this
        uniforms.highlight = typeof this.highlightColor !== "undefined";
        uniforms.highlightColor = this.highlightColor || [ 0, 0, 0 ];

        let invCameraMatrix = Identity.slice();
        multiply(invCameraMatrix, uniforms.view, uniforms.model);
        multiply(invCameraMatrix, uniforms.projection, invCameraMatrix);
        invert(invCameraMatrix, invCameraMatrix);

        for(let i = 0; i < 3; i++) {
            uniforms.eyePosition[i] = invCameraMatrix[12 + i] / invCameraMatrix[15];
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
        uniforms.highlight = false;
        uniforms.highlightColor = [ 0, 0, 0 ];
        
        this.pickShader.bind();
        this.pickShader.uniforms = uniforms;

        this.vao.bind();
        this.vao.draw(this.gl.TRIANGLES, this.vertexCount);
        this.vao.unbind();
    }

    public update(options?: MeshOptions) {
        let worker = new Worker("worker.ts");
        let { x, y, z } = this.x3p.axes;

        // update lighting uniforms
        if(options && options.lighting) {
            let lighting = options.lighting;
            Object.assign(this.uniforms, lighting);
        } 

        // @ts-ignore
        worker.postMessage({ 
            pointBuffer: this.x3p.pointBuffer,
            axes: {
                x: x.values,
                y: y.values,
                z: z.values,
            },
        }, [ this.x3p.pointBuffer as ArrayBuffer ]);

        worker.onmessage = (e) => {
            this.renderer.setProgressValue(e.data.progress);

            if(e.data.progress === 1) {
                this.vertexCount = e.data.vertexCount;
                this.coordinateBuffer.update(e.data.buffer.subarray(0, e.data.elementCount));
                this.shape = e.data.shape;
                this.bounds = e.data.bounds;
                
                freeFloat(e.data.buffer);
                worker.terminate();

                this.dirty = true;
                this.ready = true;

                if(this.onready) this.onready();
            }
        };
    }

    public pick(selection: any) {
        if(!selection || selection.id !== this.pickId) return;

        let shape = this.shape as number[];
        let result = { 
            index: [ 0, 0 ],
            color: [ 0, 0, 0 ],
        };

        let x = shape[0] * (selection.value[0] + (selection.value[2] >> 4) / 16.0) / 255.0;
        let ix = Math.floor(x);
        let fx = x - ix;
      
        let y = shape[1] * (selection.value[1] + (selection.value[2] & 15) / 16.0) / 255.0;
        let iy = Math.floor(y);
        let fy = y - iy;

        ix++;
        iy++;

        result.index[0] = fy < 0.5 ? iy : (iy + 1);
        result.index[1] = fx < 0.5 ? ix : (ix + 1);

        return result;
    }

    public dispose() {
        this.shader.dispose();
        this.pickShader.dispose();
        this.vao.dispose();
        this.coordinateBuffer.dispose();
    }
}
