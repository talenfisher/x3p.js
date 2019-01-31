import Mesh from "./mesh";
import X3P from "../x3p";
import CameraOptions from "./camera";
import LightingOptions from "./lighting";

import createCamera from "@talenfisher/multitouch-camera";
import createSelect from "gl-select-static";
import mouseChange from "mouse-change";
import { perspective } from "gl-mat4";

const $mode = Symbol();

interface RendererOptions {
    canvas: HTMLCanvasElement;
    x3p: X3P;
    lighting?: LightingOptions;
}

export default class Renderer {
    public onpick?: any;
    public selection?: any;

    private dirty = false;
    private bounds: number[][] = [ [ 0, 0, 0 ], [ 0, 0, 0 ] ];
    private scale: number = 0;
    private fovy: number = Math.PI / 4;
    private near: number = 0.01;
    private far: number = 100;
    private canvas: HTMLCanvasElement;
    private gl: WebGLRenderingContext;
    private mesh: Mesh;
    private camera: any;
    private select: any;
    private mouseListener: any;
    
    private cameraParams = {
        model: new Array(16),
        view: null,
        projection: new Array(16),
    };

    private [$mode]: "normal" | "still" = "normal";

    constructor(options: RendererOptions) {
        this.canvas = options.canvas;
        window.addEventListener("resize", this.resizeListener.bind(this));
        this.resizeListener();

        this.gl = this.getContext(this.canvas);
        this.camera = createCamera(this.canvas, CameraOptions);
        this.select = createSelect(this.gl, this.shape);
        this.mouseListener = mouseChange(this.canvas, this.mouseHandler.bind(this));
        this.mesh = new Mesh(options);
        this.mesh.onready = () => {
            this.dirty = true;
            this.updateBounds();
            this.render();
        };
    }

    public render() {
        requestAnimationFrame(this.render.bind(this));

        let cameraMoved = this.camera.tick();
        if(!(this.dirty || cameraMoved)) return;
        this.updateCameraParams();

        if(cameraMoved) this.drawMesh();
        if(this.mode === "still") this.drawPick();
    }

    public resizeListener() {
        this.canvas.setAttribute("width", this.canvas.offsetWidth.toString());
        this.canvas.setAttribute("height", this.canvas.offsetHeight.toString());
        this.dirty = true;
    }

    public dispose() {
        this.gl.clear(this.gl.DEPTH_BUFFER_BIT | this.gl.COLOR_BUFFER_BIT);
        this.mesh.dispose();
        this.select.dispose();

        this.mouseListener.enabled = false;
        window.removeEventListener("resize", this.resizeListener.bind(this));
    }

    public get mode() {
        return this[$mode];
    }

    public set mode(mode: "normal" | "still") {
        if(!["normal", "still"].includes(mode)) {
            throw new Error("Mode must be either normal or still");
        }

        this[$mode] = mode;
        this.update();
    }

    public get width() {
        return this.gl.drawingBufferWidth;
    }

    public get height() {
        return this.gl.drawingBufferHeight;
    }

    public get shape() {
        return [ this.width, this.height ];
    }

    public update() {
        switch(this[$mode]) {
            default:
            case "normal":
                this.camera.rotateSpeed = 1;
                break;
            
            case "still":
                this.camera.rotateSpeed = 0;
                break;
        }
    }

    public drawMesh() {
        let gl = this.gl;

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, this.width, this.height);
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.depthMask(true);
        gl.colorMask(true, true, true, true);
        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LEQUAL);
        gl.disable(gl.BLEND);
        gl.disable(gl.CULL_FACE);

        this.mesh.draw(this.cameraParams);
        this.dirty = false;
    }

    public drawPick() {
        let gl = this.gl;

        gl.colorMask(true, true, true, true);
        gl.depthMask(true);
        gl.disable(gl.BLEND);
        gl.enable(gl.DEPTH_TEST);

        this.select.shape = this.shape;
        this.select.begin();
        this.mesh.drawPick(this.cameraParams);
        this.select.end();
        this.dirty = false;
    }

    private mouseHandler(buttons: number, x: number, y: number) {
        if(this.mode !== "still") return;
        this.dirty = true;
        let queryResult = this.select.query(x, this.shape[1] - y - 1, 10);
        let pickResult = this.mesh.pick(queryResult);
        
        if(pickResult) {
            this.selection = pickResult;
            if(this.onpick) this.onpick(pickResult);
        }
    }

    private resetModelMatrix() {
        let model = this.cameraParams.model;
        
        model[15] = 1;
        for(let i = 0; i < 15; i++) {
            model[i] = 0;
        }
    }

    private updateCameraParams() {
        perspective(this.cameraParams.projection, this.fovy, this.width / this.height, this.near, this.far);
        this.cameraParams.view = this.camera.matrix;

        this.resetModelMatrix();
        let model = this.cameraParams.model;
        for(let i = 0; i < 3; i++) {
            model[5 * i] = 1 / this.scale;
            model[12 + i] = -model[5 * i] * 0.5 * (this.bounds[0][i] + this.bounds[1][i]);
        }
    }

    private updateBounds() {
        let objBounds = this.mesh.bounds as number[][];
        
        for(let i = 0; i < 3; i++) {
            let [ lo, hi ] = objBounds;

            if(hi[i] < lo[i]) {
                this.bounds[0][i] = -1;
                this.bounds[1][i] = 1;
            } else {
                let padding = 0.05 * (hi[i] - lo[i]);
                this.bounds[0][i] = lo[i] - padding;
                this.bounds[1][i] = hi[i] + padding;
            }

            this.scale = Math.max(this.scale, this.bounds[1][i] - this.bounds[0][i]);
        }
    }

    private getContext(canvas: HTMLCanvasElement): WebGLRenderingContext {
        if(this.gl) return this.gl;

        let options = { premultipliedAlpha: true, antialias: true };
        let context = canvas.getContext("webgl", options) as WebGLRenderingContext;
        if(context === null) {
            throw new Error(`Unable to get the WebGL Rendering Context`);
        }

        return context;
    }
}
