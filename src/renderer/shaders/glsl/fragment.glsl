precision mediump float;

#pragma glslify: beckmann = require(glsl-specular-beckmann) 

uniform float roughness, fresnel, ambient, diffuse, specular;

varying vec3 eyeDirection, surfaceNormal;
varying vec4 vColor;

void main() {
    vec3 normal = normalize(surfaceNormal);
    vec3 direction = normalize(eyeDirection);
    
    if(gl_FrontFacing) {
        normal = -surfaceNormal;
    }

    float cSpecular = max(beckmann(direction, direction, normal, roughness), 0.0);
    float cDiffuse = min(ambient + diffuse * max(dot(normal, direction), 0.0), 1.0);

    gl_FragColor = vColor.a * vec4(cDiffuse * vColor.rgb + specular * cSpecular, 1.0);
}