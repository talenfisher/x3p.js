precision mediump float;

attribute vec3 vCoord;
attribute vec3 normal;
attribute vec2 tCoord;

uniform mat4 model, view, projection, inverseModel;

varying vec3 worldCoordinate;
varying vec4 vColor;

void main() {
    worldCoordinate = vCoord;
    vec4 worldPosition = model * vec4(worldCoordinate, 1.0);
    vec4 clipPosition = projection * view * worldPosition;

    gl_Position = clipPosition;
    vColor = vec4(1.0, 0.0, 0.0, 1.0);
}