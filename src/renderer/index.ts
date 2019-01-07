import Mesh from "./mesh";
import X3P from "../x3p";
import CameraOptions from "./camera";

import createScene from "@talenfisher/gl-plot3d";

interface RendererOptions {
    canvas: HTMLCanvasElement;
    x3p: X3P;
}

export default class Renderer {
    private canvas: HTMLCanvasElement;
    private mesh: Mesh;
    private scene: any;

    constructor(options: RendererOptions) {
        this.canvas = options.canvas;
        this.canvas.setAttribute("width", this.canvas.offsetWidth.toString());
        this.canvas.setAttribute("height", this.canvas.offsetHeight.toString());

        this.scene = createScene({
            canvas: this.canvas,
            pixelRatio: 1,
            autoResize: false,
            camera: CameraOptions
        });

        this.mesh = new Mesh(options);
        this.scene.add(this.mesh);
    }
} 