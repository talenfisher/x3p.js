import { ElementTree, parse, SubElement } from "elementtree";
import X3PLoader from "index";
import AnnotationHandler from "./annotation-handler";

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

}