export default class Renderer {
    constructor({ canvas, x3p }) {
        this._checkEnvironment();
        this._canvas = canvas;
        this._gl = this._canvas.getContext("webgl");
        this._x3p = x3p;

        if(this._gl === null) throw new Error("WebGL not supported");
        this.clear();
    }

    _checkEnvironment() {
        if(typeof global !== "undefined") {
            throw new Error("Rendering not supported in Node.js yet.");
        }
    }

    clear() {
        this._gl.clearColor(1.0, 1.0, 1.0, 1.0);
        this._gl.clear(this._gl.COLOR_BUFFER_BIT);
    }
}