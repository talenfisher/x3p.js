import Manifest from "../manifest";
import AnnotationHandler from "./annotation-handler";

import { EventEmitter } from "events";
import { Canvas } from "@talenfisher/canvas";
import createTexture from "gl-texture2d";

export interface MaskOptions {
    manifest: Manifest;
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

export default class Mask extends EventEmitter {
    public annotations: { [name: string]: any };
    public color: string;
    public canvas?: Canvas;
    private manifest: Manifest;
    private definition: Element;
    private dataBuffer?: ArrayBuffer;
    private texture?: any;

    constructor(options: MaskOptions) {
        super();
        let definition = options.manifest.getNode("Record3 Mask");
        if(!definition) {
            throw new Error("Record3 Mask is not defined in the manifest");
        }

        let color = options.manifest.get("Record3 Mask Background") as string | undefined;
        if(!color) {
            throw new Error("Record3 Mask Background is not defined");
        }

        this.manifest = options.manifest;
        this.dataBuffer = options.data;
        this.definition = definition;
        this.color = color;
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
            
            this.canvas.drawImage(img);

            if(this.texture) {
                this.texture.setPixels(el);
                this.emit("loaded");
            }

        } else {
            this.canvas.clear(this.color);
        }
    }

    get height(): number {
        let size = this.manifest.get("Record3 MatrixDimension SizeY");
        return typeof size !== "undefined" ? Number(size) : 0;
    }

    get width() {
        let size = this.manifest.get("Record3 MatrixDimension SizeX");
        return typeof size !== "undefined" ? Number(size) : 0;
    }
}
