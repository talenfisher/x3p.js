import Mesh from "./mesh";
import X3P from "../x3p";
import CameraOptions from "./camera";
import LightingOptions from "./lighting";

import createScene from "@talenfisher/gl-plot3d";

interface RendererOptions {
    canvas: HTMLCanvasElement;
    x3p: X3P;
    lighting?: LightingOptions;
}

export default class Renderer {
    private canvas: HTMLCanvasElement;
    private gl: WebGLRenderingContext;
    private mesh: Mesh;
    private scene: any;

    constructor(options: RendererOptions) {
        this.canvas = options.canvas;
        this.canvas.setAttribute("width", this.canvas.offsetWidth.toString());
        this.canvas.setAttribute("height", this.canvas.offsetHeight.toString());

        let context = this.canvas.getContext("webgl") || this.canvas.getContext("experimental-webgl");
        if(context === null) {
            throw new Error(`Unable to get the WebGL Rendering Context`);
        }
        
        this.gl = context;
        this.gl.depthFunc(this.gl.ALWAYS);

        this.scene = createScene({
            canvas: this.canvas,
            pixelRatio: 1,
            autoResize: false,
            camera: CameraOptions,
        });

        this.mesh = new Mesh(options);
        this.scene.add(this.mesh);
    }
}
