precision highp float;

uniform sampler2D u_state;
varying vec2 vUv;

void main() {
    float v = texture2D(u_state, vUv).r;
    // version gris
    // gl_FragColor = vec4(vec3(v), 1.0);

    // version un peu psyché
    vec3 col = vec3(
        0.5 + 0.5 * sin(10.0 * v),
        0.5 + 0.5 * sin(10.0 * v + 2.0),
        0.5 + 0.5 * sin(10.0 * v + 4.0)
    );
    gl_FragColor = vec4(col, 1.0);
}
