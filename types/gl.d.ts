declare module "gl-buffer" {
    export interface GLBuffer {
        [name: string]: any;
    }

    export default function createBuffer(gl: WebGLRenderingContext, data?: ArrayBuffer, type?: any, usage?: any): GLBuffer;
}

declare module "gl-vao" {
    export interface GLVao {
        [name: string]: any;
    }

    export default function createVAO(gl: WebGLRenderingContext, options: any[]): GLVao;
}

declare module "@talenfisher/gl-plot3d" {
    export default function createScene(...args: any[]): any;
}

declare module "gl-mat4" {
    export function invert(...args: any[]): any;
    export function multiply(...args: any[]): any;
    export function perspective(...args: any[]): any;
}

declare module "3d-view-controls" {
    export default function createCamera(canvas: HTMLCanvasElement, options: any): any;
}

declare module "gl-texture2d" {
    export default function createTexture(...args: any[]): any;
}

declare module "gl-select-static" {
    export default function createSelect(gl: WebGLRenderingContext, shape: number[]): any;
}

declare module "mouse-change" {
    export default function mouseChange(...args: any[]): any;
}

declare module "*.glsl" {
    const value: string;
    export default value;
}