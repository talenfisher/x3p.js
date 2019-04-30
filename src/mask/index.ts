import Manifest from "../manifest";
import AnnotationHandler from "./annotation-handler";

import { EventEmitter } from "events";
import { Canvas } from "@talenfisher/canvas";
import Color, { Precision } from "@talenfisher/color";
import createTexture from "gl-texture2d";

const MASK_VERSION = 2;
const MASK_VERSION_DEFAULT = 1; // what mask version to assume if its not specified
const MASK_BACKGROUND_DEFAULT = new Color("#cd7f32");

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
    public colors: Color[] = [];
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
        this.bootstrap();
    }

    public getTexture(gl: WebGLRenderingContext) {
        if(!this.canvas) return;
        
        return this.texture ? this.texture : this.texture = createTexture(gl, this.canvas.el);
    }

    public getAnnotationColors() {
        let colors: string[] = [];

        this.definition.querySelectorAll(`Annotation[color]`).forEach((element: Element) => {
            let attr = element.getAttribute("color");

            if(typeof attr !== "undefined" && attr !== null) {
                colors.push(attr);
            }
        });

        return colors;
    }

    private async bootstrap() {
        if(process.env.ENV === "testing") return;

        await this.setupCanvas();
        await this.getColors();

        this.version = MASK_VERSION;
        this.emit("loaded");
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
            }

        } else {
            this.canvas.clear(this.color);
        }
    }

    private getColors() {
        return new Promise((resolve, reject) => {
            let canvas = this.canvas as Canvas;
            let imageData = canvas.getImageData();
            let height = imageData.height;
            let width = imageData.width;
            let worker = new Worker("./worker/index.ts");

            worker.postMessage({
                imageData: imageData.data,
                annotations: this.getAnnotationColors(),
                background: this.color,
                version: this.version,
            }, [ imageData.data.buffer ]);

            worker.onmessage = (e) => {
                // tslint:disable-next-line:no-shadowed-variable
                let canvas = this.canvas as Canvas;                
                canvas.putImageData(new ImageData(e.data.imageData, width, height));
                this.colors = e.data.colors.map((key: string) => new Color(key));
                resolve();
            };

            worker.onerror = (e) => reject();
        });
    }

    get height(): number {
        let size = this.manifest.get("Record3 MatrixDimension SizeY");
        return typeof size !== "undefined" ? Number(size) : 0;
    }

    get width() {
        let size = this.manifest.get("Record3 MatrixDimension SizeX");
        return typeof size !== "undefined" ? Number(size) : 0;
    }

    get version() {
        let version = this.manifest.get("Record3 Mask Version");
        return typeof version !== "undefined" ? Number(version) : MASK_VERSION_DEFAULT;
    }

    set version(version: number) {
        this.manifest.set("Record3 Mask Version", version);
    }
}
