precision mediump float;

uniform float pickId;

varying vec2 planeCoordinate;

vec2 splitFloat(float value) {
    float adjusted = value * 255.0;
    float upper = floor(adjusted);
    float lower = fract(adjusted);

    return vec2(upper / 255.0, floor(lower * 16.0) / 16.0);
}

void main() {
    vec2 ux = splitFloat(planeCoordinate.x);
    vec2 uy = splitFloat(planeCoordinate.y);

    gl_FragColor = vec4(pickId, ux.x, uy.x, ux.y + (uy.y / 16.0));
}