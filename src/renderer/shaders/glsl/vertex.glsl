precision mediump float;

attribute vec3 vCoord;
attribute vec3 normal;
attribute vec2 tCoord;

uniform mat4 model, view, projection, inverseModel;
uniform vec3 lightPosition, eyePosition;
uniform sampler2D texture;

varying vec3 worldCoordinate, eyeDirection, lightDirection, surfaceNormal;
varying vec4 vColor;

void main() {
    worldCoordinate = vCoord.xyz;
    vec4 worldPosition = model * vec4(worldCoordinate, 1.0);
    gl_Position = projection * view * worldPosition;
    vColor = texture2D(texture, tCoord);

    vec4 cameraCoordinate = view * worldPosition;
    cameraCoordinate.xyz /= cameraCoordinate.w;
    lightDirection = lightPosition - cameraCoordinate.xyz;
    eyeDirection = eyePosition - cameraCoordinate.xyz;
    surfaceNormal = normalize((vec4(normal, 0) * inverseModel).xyz);
}