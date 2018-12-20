import AnnotationHandler from "./annotation-handler";

import { Canvas } from "@talenfisher/canvas";
import { Element, ElementTree, parse, SubElement } from "elementtree";
import { resolve } from "path";

export interface MaskOptions {
    manifest: ElementTree;
    definition?: ElementTree | Element;
    color?: string;
    data?: ArrayBuffer;
}

export default class Mask {
    public annotations: { [name: string]: any };
    public color: string;
    public canvas?: Canvas;
    private manifest: ElementTree;
    private definition: ElementTree | Element;
    private dataBuffer?: ArrayBuffer;

    constructor(options: MaskOptions) {
        this.manifest = options.manifest;
        this.color = options.color || "#cd7f32";
        this.dataBuffer = options.data;
        
        // create definition if it doesn't exist
        if(!options.definition) {
            let Record3 = this.manifest.find("./Record3") || SubElement(this.manifest.getroot(), "Record3");
            options.definition = SubElement(Record3, "Mask");
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
        let el = this.manifest.find("./Record3/MatrixDimension/SizeY");
        return el !== null ? Number(el.text) : 0;
    }

    get width() {
        let el = this.manifest.find("./Record3/MatrixDimension/SizeX");
        return el !== null ? Number(el.text) : 0;
    }
}
