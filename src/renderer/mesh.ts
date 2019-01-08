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
        let worker = new Worker("./worker.ts");
        
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
            this.coordinateBuffer.update(e.data.coords.subarray(0, e.data.elementCount));

            console.log(e.data.coords); // tslint:disable-line

            freeFloat(e.data.coords);
            worker.terminate();
        };
    }

    public isOpaque() {
        return true;
    }
}
