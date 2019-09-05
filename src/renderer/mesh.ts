import X3P from "../index";
import Identity from "./identity";
import createShader from "./shaders/index";
import Renderer from "./index";

import createBuffer, { GLBuffer } from "gl-buffer";
import createVAO, { GLVao } from "gl-vao";
import { invert, multiply } from "gl-mat4";
import LightingOptions from "./lighting";
import { EventEmitter } from "events";

/**
 * Options passed to the mesh constructor
 */
export interface MeshOptions {

    /**
     * The X3P file to create a mesh for
     */
    x3p: X3P;

    /**
     * The renderer to attach the mesh to
     */
    renderer: Renderer;

    /**
     * The canvas to render the mesh on
     */
    canvas: HTMLCanvasElement;

    /**
     * lighting options to use for the mesh
     */
    lighting?: LightingOptions;

    /**
     * Polygon decimation factor, controls how many vertices to skip
     * 0 = high quality, no vertices are skipped
     * 1 = low quality, many vertices are skipped
     */
    decimationFactor?: number;
}

/**
 * The result of point picking (clicking on the canvas to select a point)
 */
export interface PickResult {
    /**
     * Where on the mesh was clicked in terms of x and y
     */
    index: number[];

    /**
     * Color on the texture at the pick result index
     */
    color?: string;
}

/**
 * Represents an anomaly in the surface matrix
 */
export interface Anomaly {

    /**
     * An identifier for the anomaly
     */
    identifier: string;

    /**
     * A description of what the anomaly entails
     */
    description: string;

    /**
     * An expected value or threshold
     */
    expected: any;

    /**
     * The actual value received
     */
    actual: any;
}

const STRIDE = 4 * (3 + 3 + 2);

const MISSING_FACTOR_THRESHOLD = 0.1;

/**
 * This class was originally based off of gl-vis/gl-surface3d (https://github.com/gl-vis/gl-surface3d).  
 * It has been modified to use less memory and
 * not block the UI thread while building vertices.  Furthermore, point picking
 * now only occurs when the renderer is in "still" mode
 */

export default class Mesh extends EventEmitter {

    /**
     * Whether or not the mesh is ready to be rendered
     */
    public ready: boolean = false;

    /**
     * Which color to highlight, if any
     */
    public highlightColor?: number[];

    /**
     * The bounds of the mesh.  indice 0 is the lower bound, while indice 1 is the upper bound
     */
    public bounds?: number[][];

    /**
     * functional onready listener.
     * @deprecated use .on("ready") instead
     */
    public onready?: any;

    /**
     * The decimation factor to use when building vertices
     */
    public decimationFactor: number;

    /**
     * The renderer that this mesh belongs to.
     */
    private renderer: Renderer;

    /**
     * The shape of this mesh in terms of x, y, z
     */
    private shape?: number[];

    /**
     * The X3P this mesh is built around
     */
    private x3p: X3P;

    /**
     * The canvas this mesh is being rendered on
     */
    private canvas: HTMLCanvasElement;
    
    /**
     * The webgl rendering context being used to render this mesh
     */
    private gl: WebGLRenderingContext; 

    /**
     * The vertex array object used to translate coordinates to the GPU
     */
    private vao: GLVao;

    /**
     * The texture to use for this mesh, generated using gl-texture2d
     */
    private texture: any;

    /**
     * The coordinate buffer to use
     */
    private coordinateBuffer: GLBuffer;

    /**
     * The number of vertices in this mesh
     */
    private vertexCount: number = 0;

    /**
     * The shader to use for this mesh
     */
    private shader: any;
    
    /**
     * The pick shader to use for this mesh
     */
    private pickShader: any;

    /**
     * A list of anomalies found on the X3P's surface matrix.
     */
    private anomalies: Anomaly[] = [];

    /**
     * The shader uniforms to use during rendering
     */
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
    };

    /**
     * The pick uniforms to use during rendering
     */
    private pickUniforms = Object.assign({}, this.uniforms);

    /**
     * Constructs a new Mesh
     * 
     * @param options options to use for the mesh
     */
    constructor(options: MeshOptions) {
        super();
        this.x3p = options.x3p;
        this.renderer = options.renderer;
        this.canvas = options.canvas;
        this.gl = this.canvas.getContext("webgl") as WebGLRenderingContext;
        this.shader = createShader(this.gl);
        this.pickShader = createShader(this.gl, "pick");
        this.coordinateBuffer = createBuffer(this.gl, undefined, this.gl.ARRAY_BUFFER, this.gl.STATIC_DRAW);
        this.texture = this.x3p.mask.getTexture(this.gl);
        this.decimationFactor = options.decimationFactor || 0;
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

    /**
     * Draws the mesh onto the canvas
     * 
     * @param options drawing options
     */
    public draw(options: any) {
        if(!this.ready) return;

        this.gl.disable(this.gl.CULL_FACE);
        this.texture.bind(0);

        let uniforms = this.uniforms;
        uniforms.model = options.model;
        uniforms.projection = options.projection;
        uniforms.view = options.view;
        uniforms.inverseModel = invert(uniforms.inverseModel, uniforms.model);
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

    /**
     * Draw the pick onto the canvas.  This isn't seen by the user.
     * 
     * @param options drawing options for the pick
     */
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

    /**
     * Updates the mesh coordinate buffer
     * 
     * @param options options to use 
     */
    public update(options?: MeshOptions) {
        let worker = new Worker("./worker/index.ts");
        let { x, y, z } = this.x3p.axes;
        let origin = this.x3p.manifest.get("Record1 Axes Origin");

        // update lighting uniforms
        if(options && options.lighting) {
            let lighting = options.lighting;
            Object.assign(this.uniforms, lighting);
        } 

        worker.postMessage({ 
            origin,
            pointBuffer: this.x3p.pointBuffer,
            decimationFactor: this.decimationFactor,
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
                this.ready = true;
                
                if(e.data.missingFactor >= MISSING_FACTOR_THRESHOLD) {
                    this.anomalies.push({
                        identifier: "MISSING_DATA",
                        description: "There is a large amount of missing data on this X3P file.",
                        expected: MISSING_FACTOR_THRESHOLD,
                        actual: e.data.missingFactor,
                    });
                }

                console.log(this.anomalies);

                if(this.onready) this.onready();
                this.emit("ready");
            }
        };

        worker.onerror = (error) => {
            this.emit("error", error);
        };
    }

    /**
     * Pick a coordinate and optionally, the color at that coordinate
     * 
     * @param selection selection created from gl-select-static
     * @param includeColor whether or not to include color in the pick result
     */
    public pick(selection: any, includeColor: boolean = false) {
        if(!selection) return;

        let shape = this.shape as number[];
        let result: PickResult = { 
            index: [ 0, 0 ],
            color: undefined,
        };

        let x = shape[0] * (selection.value[0] + (selection.value[2] >> 4) / 16.0) / 255.0;
        let ix = Math.floor(x);
        let fx = x - ix;
      
        let y = shape[1] * (selection.value[1] + (selection.value[2] & 15) / 16.0) / 255.0;
        let iy = Math.floor(y);
        let fy = y - iy;

        ix++;
        iy++;

        result.index[0] = fx < 0.5 ? ix : (ix + 1);
        result.index[1] = fy < 0.5 ? iy : (iy + 1);
        
        if(includeColor && this.x3p.mask.canvas) {
            result.color = this.x3p.mask.canvas.getColorAt(result.index[0], result.index[1]);
        }

        return result;
    }

    /**
     * Disposes all webgl assets for the mesh
     */
    public dispose() {
        this.shader.dispose();
        this.pickShader.dispose();
        this.vao.dispose();
        this.coordinateBuffer.dispose();
    }
}
