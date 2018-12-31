import AnnotationHandler from "./annotation-handler";
import Manifest from "../manifest";

import { Canvas } from "@talenfisher/canvas";

export interface MaskOptions {
    manifest: Manifest;
    definition?: Element;
    color?: string;
    data?: ArrayBuffer;
}

export default class Mask {
    public annotations: { [name: string]: any };
    public color: string;
    public canvas?: Canvas;
    private manifest: Manifest;
    private definition: Element;
    private dataBuffer?: ArrayBuffer;

    constructor(options: MaskOptions) {
        this.manifest = options.manifest;
        this.color = options.color || "#cd7f32";
        this.dataBuffer = options.data;
        
        // create definition if it doesn't exist
        if(!options.definition) {
            this.manifest.set("Record3 Mask", "");
            options.definition = this.manifest.getNode("Record3 Mask");
        }
        
        this.definition = options.definition as Element;
        this.annotations = new Proxy(this.definition, AnnotationHandler);
        this.setupCanvas();
    }

    private setupCanvas() {
        if(this.width === 0 || this.height === 0) return;

        this.canvas = new Canvas({ height: this.height, width: this.width });

        if(this.dataBuffer) {
            let data = new Uint8ClampedArray(this.dataBuffer);
            let imageData = new ImageData(data, this.width, this.height);
            this.canvas.putImageData(imageData, 0, 0);            
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
