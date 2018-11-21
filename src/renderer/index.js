import Shader from "./shader";
import { mat4 } from "gl-matrix";

const DEFAULTS = {
    zNear: 0.1,
    zFar: 100,
    fieldOfView: 45 * Math.PI / 180
};

export default class Renderer {
    constructor({ canvas, x3p, ...options }) {
        this._checkWebGLSupport(canvas);
        
        this._x3p = x3p;
        this._aspectRatio = options.aspectRatio || (this._gl.canvas.clientWidth / this._gl.canvas.clientHeight);
        this._zNear = options.zNear || DEFAULTS.zNear;
        this._zFar = options.zFar || DEFAULTS.zFar;
        this._fieldOfView = options.fieldOfView || DEFAULTS.fieldOfView;
        this._projectionMatrix = mat4.create();
        this._modelViewMatrix = mat4.create();
        this._shader = new Shader({ gl: this._gl });
        this._buffers = {};

        this._bootstrap();
        this.clear();
    }

    _checkWebGLSupport(canvas) {
        if(typeof global !== "undefined") {
            throw new Error("Rendering not supported in Node.js yet.");
        }

        this._canvas = canvas;
        this._gl = this._canvas.getContext("webgl");

        if(this._gl === null) {
            throw new Error("WebGL not supported");
        }
    }

    _bootstrap() {
        // setup persepective
        mat4.perspective(this._projectionMatrix, this._fieldOfView, this._aspectRatio, this.zNear, this.zFar);

        // create position buffer
        this._buffers.position = this._gl.createBuffer();
        this._gl.bindBuffer(this._gl, this._buffers.position);
        this._gl.bufferData(this._gl.ARRAY_BUFFER, this._x3p.vertexPositions, this._gl.STATIC_DRAW);
        this._gl.vertexAttribPointer(this._shader.attributes.position, 3, this._gl.FLOAT, false, 0, 0);
        this._gl.enableVertexAttribArray(this._shader.attributes.position);
    }

    clear() {
        this._gl.clearColor(1.0, 1.0, 1.0, 1.0);
        this._gl.clear(this._gl.COLOR_BUFFER_BIT);
    }
}