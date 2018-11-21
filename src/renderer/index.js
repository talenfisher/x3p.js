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
        this._shader = (new Shader({ gl: this._gl })).program;

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
    }

    clear() {
        this._gl.clearColor(1.0, 1.0, 1.0, 1.0);
        this._gl.clear(this._gl.COLOR_BUFFER_BIT);
    }
}