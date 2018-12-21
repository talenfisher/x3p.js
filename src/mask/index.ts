import AnnotationHandler from "./annotation-handler";

import { Canvas } from "@talenfisher/canvas";

export interface MaskOptions {
    manifest: Document;
    definition?: Element;
    color?: string;
    data?: ArrayBuffer;
}

export default class Mask {
    public annotations: { [name: string]: any };
    public color: string;
    public canvas?: Canvas;
    private manifest: Document;
    private definition: Element;
    private dataBuffer?: ArrayBuffer;

    constructor(options: MaskOptions) {
        this.manifest = options.manifest;
        this.color = options.color || "#cd7f32";
        this.dataBuffer = options.data;
        
        // create definition if it doesn't exist
        if(!options.definition) {
            let Record3 = this.manifest.querySelector("Record3");
            
            if(!Record3) {
                Record3 = this.manifest.createElement("Record3");
                
                let root = this.manifest.documentElement as Element;
                root.appendChild(Record3);
            }

            options.definition = this.manifest.createElement("Mask");
            Record3.appendChild(options.definition);
        }
        
        this.definition = options.definition;
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
        let el = this.manifest.querySelector("Record3 MatrixDimension SizeY");
        return el ? Number(el.innerHTML) : 0;
    }

    get width() {
        let el = this.manifest.querySelector("Record3 MatrixDimension SizeX");
        return el ? Number(el.innerHTML) : 0;
    }
}
