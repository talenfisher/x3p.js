import Mesh, { MeshOptions, PickResult } from "./mesh";
import X3P from "../index";
import CameraOptions from "./camera";
import LightingOptions from "./lighting";
import { readFileSync as read } from "fs";

import createCamera from "@talenfisher/multitouch-camera";
import createSelect from "gl-select-static";
import mouseChange from "mouse-change";
import { EventEmitter } from "events";
import { perspective } from "gl-mat4";

const $mode = Symbol();
const STYLES = read(__dirname + "/style.css", { encoding: "utf-8" });

export interface RendererOptions {
    canvas: HTMLCanvasElement;
    x3p: X3P;
    lighting?: LightingOptions;
    decimationFactor?: number;
}

/**
 * Class for rendering an X3P file
 * 
 * @author Talen Fisher
 */
export default class Renderer extends EventEmitter {

    /**
     * Functional onpick handler
     * @deprecated use .on("pick") instead
     */
    public onpick?: any;

    /**
     * Pick selection object
     */
    public selection?: PickResult;

    /**
     * The container around the canvas element
     */
    private canvasContainer?: HTMLElement;

    /**
     * Progress elements
     */
    private progress: { bar?: HTMLElement, screen?: HTMLElement } = {};

    /**
     * Whether or not the renderer has stopped
     */
    private stopped = false;

    /**
     * Whether or not the scene needs to be redrawn
     */
    private dirty = false;

    /**
     * The scene bounds.  Indice 0 is the lower bound, 1 is the upper bound.
     * Each bound is in terms of x, y, z
     */
    private bounds: number[][] = [ [ 0, 0, 0 ], [ 0, 0, 0 ] ];

    /**
     * Camera scale
     */
    private scale: number = 0;

    /**
     * Camera field of view angle
     */
    private fovy: number = Math.PI / 4;

    /**
     * Near depth clipping
     */
    private near: number = 0.01;

    /**
     * Far depth clipping
     */
    private far: number = 100;

    /**
     * The canvas to render on
     */
    private canvas: HTMLCanvasElement;

    /**
     * The rendering context to use
     */
    private gl: WebGLRenderingContext;

    /**
     * The mesh to render
     */
    private mesh: Mesh;

    /**
     * The camera to use
     */
    private camera: any;

    /**
     * Point picker
     */
    private select: any;

    /**
     * Mouse event handler
     */
    private mouseListener: any;
    
    /**
     * Camera matrices
     */
    private cameraParams = {
        model: new Array(16),
        view: null,
        projection: new Array(16),
    };

    /**
     * The current mode
     */
    private [$mode]: "normal" | "still" = "normal";

    /**
     * Constructs a new Renderer
     * 
     * @param options options to use for rendering
     */
    constructor(options: RendererOptions) {
        super();
        this.canvas = options.canvas;

        window.addEventListener("resize", this.resizeHandler.bind(this));
        this.resizeHandler();
        this.containerize();
        this.addProgressBar();

        this.gl = this.getContext(this.canvas);
        this.camera = createCamera(this.canvas, CameraOptions);
        this.select = createSelect(this.gl, this.shape);
        
        this.mouseListener = mouseChange(this.canvas, this.mouseHandler.bind(this));
        this.mouseListener.enabled = true;

        let meshDefaults = { renderer: this };
        this.mesh = new Mesh(Object.assign(meshDefaults, options));
        
        this.mesh.on("ready", () => {
            this.dirty = true;
            this.updateBounds();
            this.emit("start");
            this.render();
        });

        let onerror = (error: any) => {
            this.emit("error", error);
            this.dispose();
        };

        this.mesh.on("error", onerror);
        this.canvas.addEventListener("webglcontextlost", () => onerror("Lost the WebGL context"));
    }

    /**
     * Begin/continue the rendering loop until stopped
     */
    public render() {
        if(this.stopped) return;
        requestAnimationFrame(this.render.bind(this));

        let cameraMoved = this.camera.tick();
        if(!(this.dirty || cameraMoved)) return;
        this.updateCameraParams();

        if(cameraMoved) this.drawMesh();
        if(this.mode === "still") this.drawPick();
    }

    /**
     * Stops rendering and disposes WebGL assets
     */
    public dispose() {
        this.stopped = true;
        this.gl.clear(this.gl.DEPTH_BUFFER_BIT | this.gl.COLOR_BUFFER_BIT);
        this.mesh.dispose();
        this.select.dispose();

        this.mouseListener.enabled = false;
        window.removeEventListener("resize", this.resizeHandler.bind(this));
        this.emit("end");
    }

    /**
     * Gets the mode of the renderer
     */
    public get mode(): "normal" | "still" {
        return this[$mode];
    }

    /**
     * Sets the mode of the renderer.  In still mode, the mesh cannot be rotated.
     * 
     * @param mode the mode to set the renderer to (mode or still)
     */
    public set mode(mode: "normal" | "still") {
        if(!["normal", "still"].includes(mode)) {
            throw new Error("Mode must be either normal or still");
        }

        this[$mode] = mode;
        this.update();
    }

    /**
     * Get the width of the renderer viewport
     */
    public get width() {
        return this.gl.drawingBufferWidth;
    }

    /**
     * Get the height of the renderer viewport
     */
    public get height() {
        return this.gl.drawingBufferHeight;
    }

    /**
     * Get the shape of the renderer viewport
     */
    public get shape() {
        return [ this.width, this.height ];
    }

    /**
     * Synchronizes changes made to the mode.
     */
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

    /**
     * Draws the mesh
     */
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

    /**
     * Draws the pick
     */
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

    /**
     * Updates the progress bar
     * 
     * @param value the progress value
     */
    public setProgressValue(value: number) {
        if(this.progress.screen && this.progress.bar) {
            const { screen, bar } = this.progress;
            bar.style.width = (value * 100) + "%";

            if(value === 1) {
                setTimeout(() => {
                    screen.classList.remove("active");
                }, 500);
            }
        }
    }

    /**
     * Handles mouse events/interactions
     * 
     * @param buttons the buttons that were clicked
     * @param x x-coordinate where the mouse was clicked
     * @param y y-coordinate where the mouse was clicked
     */
    private mouseHandler(buttons: number, x: number, y: number) {
        if(this.mode !== "still") return;
        this.dirty = true;
        
        let queryResult = this.select.query(x, this.shape[1] - y - 1, 10);
        let includeColor = !!(buttons & 2); // right click
        let pickResult = this.mesh.pick(queryResult, includeColor);
        
        if(pickResult) {
            this.selection = pickResult;
            
            if(this.onpick) {
                this.emit("pick", pickResult);
                this.onpick(pickResult);
            }
        }
    }

    /**
     * Handles window resizes
     */
    private resizeHandler() {
        this.canvas.setAttribute("width", this.canvas.offsetWidth.toString());
        this.canvas.setAttribute("height", this.canvas.offsetHeight.toString());
        this.dirty = true;
    }

    /**
     * Resets the model matrix
     */
    private resetModelMatrix() {
        let model = this.cameraParams.model;
        
        model[15] = 1;
        for(let i = 0; i < 15; i++) {
            model[i] = 0;
        }
    }

    /**
     * Updates the camera matrices
     */
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

    /**
     * Updates the renderer bounds
     */
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

    /**
     * Retrieves the webgl rendering context from a canvas
     * 
     * @param canvas the canvas to get the rendering context from
     */
    private getContext(canvas: HTMLCanvasElement): WebGLRenderingContext {
        if(this.gl) return this.gl;

        let options = { premultipliedAlpha: true, antialias: true };
        let context = canvas.getContext("webgl", options) as WebGLRenderingContext;
        if(context === null) {
            throw new Error(`Unable to get the WebGL Rendering Context`);
        }

        return context;
    }

    /**
     * Whether or not the canvas being rendered to is attached to a document
     */
    private get canvasIsAttached() {
        return this.doc !== null;
    }

    /**
     * Gets the document where the canvas is being rendered on
     */
    private get doc() {
        return this.canvas.ownerDocument;
    }

    /**
     * Puts the canvas being rendered to inside a container, so that other elements may be added
     * like the progress bar.
     */
    private containerize() {
        if(!this.canvasIsAttached) return;

        let canvasParent = this.canvas.parentElement as HTMLElement;
        if(canvasParent.classList.contains("x3pjs-render")) {
            this.canvasContainer = canvasParent;
            this.removeScreens();
            return;
        }

        let doc = this.doc as Document;
        let style = doc.createElement("style");
        style.innerHTML = STYLES;
        doc.head.appendChild(style);

        let parent = this.canvas.parentElement as HTMLElement;
        let container = doc.createElement("div");
        container.classList.add("x3pjs-render");
        
        parent.removeChild(this.canvas);
        container.appendChild(this.canvas);
        parent.appendChild(container);

        this.canvasContainer = container;
    }

    /**
     * Create a screen/overlay on top of the canvas being rendered to.
     * 
     * @param id an id to give the screen
     */
    private createScreen(id: string) {
        if(!this.canvasIsAttached || !this.canvasContainer) return;

        let doc = this.doc as Document;
        let screen = doc.createElement("div");
        screen.classList.add("x3pjs-render-screen");
        screen.id = id;
        
        this.canvasContainer.appendChild(screen);
        return screen;
    }

    /**
     * Remove all screens from the canvas' container
     */
    private removeScreens() {
        if(!this.canvasContainer) return;

        for(let child of Array.from(this.canvasContainer.children)) {
            if(child.classList.contains("x3pjs-render-screen")) {
                this.canvasContainer.removeChild(child);
            }
        }
    }

    /**
     * Adds a progress bar to the canvas' container
     */
    private addProgressBar() {
        if(!this.canvasIsAttached || !this.canvasContainer) return;

        let doc = this.doc as Document;
        let barContainer = doc.createElement("div");
        let bar = doc.createElement("div"); // create empty div for the progress value
        barContainer.classList.add("x3pjs-progress-bar");
        barContainer.appendChild(bar); 
        
        let screen = this.createScreen("x3pjs-progress-screen") as HTMLElement;
        screen.appendChild(barContainer);
        screen.classList.add("active");
        
        this.progress = { bar, screen };
    }
}
