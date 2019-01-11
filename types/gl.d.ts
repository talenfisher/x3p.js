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
}

declare module "gl-texture2d" {
    export default function createTexture(...args: any[]): any;
}

declare module "*.glsl" {
    const value: string;
    export default value;
}