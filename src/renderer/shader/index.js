export default class Shader {
    constructor({ gl }) {
        this._gl = gl;
        this._program = this._gl.createProgram();

        this._gl.attachShader(this._program, this._load("vertex"));
        this._gl.attachShader(this._program, this._load("fragment"));
        this._gl.linkProgram(this._program);
    }

    _load(type) {
        let shader = this._gl.createShader(this._gl[`${type.toUpperCase()}_SHADER`]);
        this._gl.shaderSource(shader, require(`./src/${type}.glsl`));
        this._gl.compileShader(shader);
        return shader;
    }

    get program() {
        return this._program;
    }
}