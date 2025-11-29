precision highp float;

uniform sampler2D u_state;
uniform vec2 u_resolution;
uniform float u_dt;
uniform float u_time;

varying vec2 vUv;

// Défini la densité moyenne du voisinage de la cellule
float neighborhood (vec2 uv)
{
    vec2 pixel = 1.0 / u_resolution;
    const int N = 100;
    float R = 10.0;
    float value = 0.0;

    for (int i = 0 ; i < N ; i++ ) {
        float angle = 2.0 * 3.14159265 * (float(i) / float(N));
        vec2 direction = vec2(cos(angle), sin(angle));
        vec2 uv_neighbor = uv + direction * R * pixel;
        uv_neighbor = mod(uv_neighbor, 1.0);
        float neighbor = texture2D(u_state, uv_neighbor).r;
        value += neighbor;
    }

    return value / float(N);
}

// Détermine l'évolution de l'état de la cellule en fonction de la densité
float growth(float density)
{
    // densité idéale
    const float mu = 0.5;
    // largeur de la cloche de la courbe gaussienne
    const float sigma = 0.2;

    float d = density - mu;
    
    // fonction gaussienne
    float g = exp(-(d * d) / (2.0 * sigma * sigma));

    return (g - 0.5) * 2.0;
}

// Génere une seed simple : un disque lumineux au centre
// float seed(vec2 uv) {
//     vec2 c = uv - 0.5;          // centre
//     float r = length(c);        // distance au centre
//     // 1.0 au centre, 0.0 après un certain rayon
//     return smoothstep(0.1, 0.0, r);
// }

// Génération d'aléatoire déterministe
float rand(vec2 p) {
    float d = dot(p, vec2(12.9898, 78.233));
    float s = sin(d);
    return fract(s * 43758.5453123);
}

float seedNoise(vec2 uv){
    float n = rand(uv * 100.0);
    return step(0.8, n);
}
float seedBlockNoise(vec2 uv){
    vec2 gridUv = floor(uv * 20.0) / 20.0;
    float n = rand(gridUv);
    return step(0.1, n);
}

void main() {    
   float current = texture2D(u_state, vUv).r;
    if (u_time < 0.1) {
        float s = seedBlockNoise(vUv);
        current = max(current, s);
    }

    float density = neighborhood(vUv);
    float g = growth(density);
    float next = current + u_dt * g;
    next = clamp(next, 0.0, 1.0);

    gl_FragColor = vec4(next, 0.0, 0.0, 1.0);
}

