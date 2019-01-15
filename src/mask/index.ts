import Manifest from "../manifest";
import AnnotationHandler from "./annotation-handler";

import { Canvas } from "@talenfisher/canvas";
import createTexture from "gl-texture2d";

export interface MaskOptions {
    manifest: Manifest;
    color?: string;
    data?: ArrayBuffer;
}

function loadImage(buffer: ArrayBuffer): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        let url = URL.createObjectURL(new Blob([ buffer ]));
        let img = new Image();
        img.onload = () => resolve(img);
        img.src = url;
    });
}

export default class Mask {
    public annotations: { [name: string]: any };
    public color: string;
    public canvas?: Canvas;
    private manifest: Manifest;
    private definition: Element;
    private dataBuffer?: ArrayBuffer;
    private texture?: any;

    constructor(options: MaskOptions) {
        this.manifest = options.manifest;
        this.color = options.color || "#cd7f32";
        this.dataBuffer = options.data;
        
        this.definition = this.manifest.getNode("Record3 Mask");
        this.annotations = new Proxy(this.definition, AnnotationHandler);
        this.setupCanvas();
    }

    public getTexture(gl: WebGLRenderingContext) {
        if(!this.canvas) return;
        
        return this.texture ? this.texture : this.texture = createTexture(gl, this.canvas.el);
    }

    private async setupCanvas() {
        if(this.width === 0 || this.height === 0) return;

        this.canvas = new Canvas({ height: this.height, width: this.width });

        if(this.dataBuffer) {
            let img = await loadImage(this.dataBuffer);
            let el = this.canvas.el;
            let ctx = this.canvas.context;
            
            this.canvas.drawImage(img);

            if(this.texture) {
                this.texture.setPixels(el);
            }

        } else {
            this.canvas.clear(this.color);
        }
    }

    get height() {
        return this.manifest.get("Record3 MatrixDimension SizeY") || 0;
    }

    get width() {
        return this.manifest.get("Record3 MatrixDimension SizeX") || 0;
    }
}
