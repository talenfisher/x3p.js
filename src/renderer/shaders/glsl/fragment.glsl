precision mediump float;

varying vec4 vColor;

void main() {
    // vec3 N = normalize(surfaceNormal);
    // vec3 V = normalize(eyeDirection);
    // vec3 L = normalize(lightDirection);

    // if(gl_FrontFacing) {
    //     N = -N;
    // }

    // float shine = max(beckmann(L, V, N, roughness), 0.0);
    // float scatter = min(ambient + diffuse * max(dot(N, L), 0.0), 1.0);
    // gl_FragColor = vColor.a * vec4(scatter * vColor.rgb + specular * vec3(1, 1, 1) * shine, 1.0);
    gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
}