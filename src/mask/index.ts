import AnnotationHandler from "./annotation-handler";

import { Canvas } from "@talenfisher/canvas";
import { Element, ElementTree, parse, SubElement } from "elementtree";

export interface MaskOptions {
    manifest: ElementTree;
    definition?: ElementTree | Element;
    color?: string;
    data?: ArrayBuffer;
}

export default class Mask {
    public annotations: { [name: string]: any };
    public color: string;
    private manifest: ElementTree;
    private definition: ElementTree | Element;
    private dataBuffer?: ArrayBuffer;
    private $canvas?: Canvas;

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
    }

    get height() {
        let el = this.manifest.find("./Record3/MatrixDimension/SizeY");
        return el !== null ? Number(el.text) : 0;
    }

    get width() {
        let el = this.manifest.find("./Record3/MatrixDimension/SizeX");
        return el !== null ? Number(el.text) : 0;
    }

    get canvas() {
        return new Promise((resolve, reject) => {
            if(!this.$canvas) {
                this.$canvas = new Canvas({ width: this.width, height: this.height });
    
                if(this.dataBuffer) {
                    let image = new Image();
                    image.onload = () => { 
                        (<Canvas> this.$canvas).drawImage(image); 
                        resolve(this.$canvas); 
                    };

                    image.src = URL.createObjectURL(new Blob([this.dataBuffer]));

                } else {
                    this.$canvas.clear(this.color);
                    resolve(this.$canvas);
                }

            } else resolve(this.$canvas);
        });
    }
}
