import VertexShaderSrc from "./glsl/vertex.glsl";
import FragmentShaderSrc from "./glsl/fragment.glsl";
import PickShaderSrc from "./glsl/pick.glsl";
import createShader from "gl-shader";

const FRAG_TYPES = {
    mesh: FragmentShaderSrc,
    pick: PickShaderSrc,
};

/**
 * Create a shader for a WebGL rendering context.
 * 
 * @param gl the rendering context to create a shader for
 * @param type the type of shader to create
 */
export default function create(gl: WebGLRenderingContext, type: "pick" | "mesh" = "mesh") {
    let vertShader = VertexShaderSrc;
    let fragShader = FRAG_TYPES[type] || undefined;

    if(!fragShader) {
        throw new Error(`${type} is not a valid fragment shader`);
    }

    let shader = createShader(gl, vertShader, fragShader, undefined, [
        { name: "worldCoordinate", type: "vec3" },
        { name: "normal", type: "vec3" },
        { name: "uv", type: "vec2" },
    ]);

    shader.attributes.worldCoordinate.location = 0;
    shader.attributes.normal.location = 1;
    shader.attributes.uv.location = 2;
    
    return shader;
}
