import { ElementTree, parse } from "elementtree";
import X3PLoader from "index";

export interface MaskOptions {
    manifest: ElementTree;
    definition?: ElementTree;
    color?: string;
    data?: ArrayBuffer;
}

export default class Mask {
    private manifest: ElementTree;
    private definition: ElementTree;
    private data?: ArrayBuffer;
    public color: string;

    constructor(options: MaskOptions) {
        this.manifest = options.manifest;
        this.definition = options.definition || parse(`<Mask></Mask>`);
        this.color = options.color || "#cd7f32";
        this.data = options.data;
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