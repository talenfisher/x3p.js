import VertexShaderSrc from "./glsl/vertex.glsl";
import FragmentShaderSrc from "./glsl/fragment.glsl";
import createShader from "gl-shader";

export default function create(gl: WebGLRenderingContext) {
    let shader = createShader(gl, VertexShaderSrc, FragmentShaderSrc, undefined, [
        { name: "vCoord", type: "vec3" },
        { name: "normal", type: "vec3" },
        { name: "uv", type: "vec2" },
    ]);

    shader.attributes.vCoord.location = 0;
    shader.attributes.normal.location = 1;
    shader.attributes.uv.location = 2;
    
    return shader;
}
