    precision highp float;

    varying vec2 vUv;
    uniform float u_time;
    uniform vec2 u_resolution;

    void main() {
        // Normalisation coords
        vec2 uv = vUv;

        // Effet simple : vagues colorées en fonction du temps
        float r = 0.5 + 0.5 * sin(u_time + uv.x * 10.0);
        float g = 0.5 + 0.5 * sin(u_time * 1.3 + uv.y * 10.0);
        float b = 0.5 + 0.5 * sin(u_time * 0.7 + (uv.x + uv.y) * 10.0);

        gl_FragColor = vec4(r, g, b, 1.0);
    }