precision mediump float;

attribute vec3 worldCoordinate;
attribute vec3 normal;
attribute vec2 uv;

uniform mat4 model, view, projection, inverseModel;
uniform vec3 eyePosition;
uniform bool highlight;
uniform vec3 highlightColor;
uniform sampler2D texture;

varying vec3 eyeDirection, surfaceNormal;
varying vec2 planeCoordinate;
varying vec4 vColor;

bool approxEqual(vec3 first, vec3 second, float margin) {
    vec3 diff = second - first;
    return 
        abs(diff.x) <= margin &&
        abs(diff.y) <= margin &&
        abs(diff.z) <= margin;
}

void main() {
    vec4 worldPosition = model * vec4(worldCoordinate, 1.0);
    gl_Position = projection * view * worldPosition;
    
    planeCoordinate = uv;

    vec3 rgb = texture2D(texture, uv).xyz;
    float a = 1.0;

    if(highlight && !approxEqual(highlightColor, rgb, 1.0e-02)) {
        a = 0.7;
    }

    vColor = vec4(rgb, a);

    vec4 cameraCoordinate = view * worldPosition;
    cameraCoordinate.xyz /= cameraCoordinate.w;
    eyeDirection = eyePosition - cameraCoordinate.xyz;
    surfaceNormal = normalize((vec4(normal, 0) * inverseModel).xyz);
}