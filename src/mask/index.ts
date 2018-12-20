import { ElementTree, parse } from "elementtree";
import AnnotationHandler from "./annotation-handler";
import { Canvas } from "@talenfisher/canvas";

export interface MaskOptions {
    manifest: ElementTree;
    definition?: ElementTree;
    color?: string;
    data?: ArrayBuffer;
}

export default class Mask {
    private manifest: ElementTree;
    private definition: ElementTree;
    private dataBuffer?: ArrayBuffer;
    public annotations: { [name: string]: any };
    public color: string;
    private $canvas?: Canvas;

    constructor(options: MaskOptions) {
        this.manifest = options.manifest;
        this.definition = options.definition || parse(`<Mask></Mask>`);
        this.color = options.color || "#cd7f32";
        this.dataBuffer = options.data;
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