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

declare module "*.glsl" {
    const value: string;
    export default value;
}