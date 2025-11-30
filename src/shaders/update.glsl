precision highp float;

uniform sampler2D u_state;
uniform vec2 u_resolution;
uniform float u_dt;
uniform float u_time;

varying vec2 vUv;

float kernel(float rNorm) {
    const float m = 0.5;   // rayon "idéal" en relatif
    const float s = 0.15;  // largeur de l'anneau
    float d = rNorm - m;
    return exp(-(d * d) / (2.0 * s * s));
}

// Défini la densité moyenne du voisinage de la cellule
float neighborhood(vec2 uv) {
    vec2 pixel = 1.0 / u_resolution;
    const int NR = 12; // nombre d'échantillons radiaux
    const int NA = 36; // nombre d'échantillons angulaires
    float R = 7.0; // rayon max en pixels 

    float sumValue = 0.0;
    float sumWeight = 0.0;

    for(int ir = 0; ir < NR; ir++) {
        float r = R * (float(ir) + 0.5) / float(NR);
        float rNorm = r / R; // [0..1]
        float w_r = kernel(rNorm); // poids radial

        for(int ia = 0; ia < NA; ia++) {
            float angle = 2.0 * 3.14159265 * (float(ia) / float(NA));
            vec2 direction = vec2(cos(angle), sin(angle));

            vec2 uv_neighbor = uv + direction * (r * pixel);
            uv_neighbor = mod(uv_neighbor, 1.0);
            float neighbor = texture2D(u_state, uv_neighbor).r;
            sumValue += w_r * neighbor;
            sumWeight += w_r;
        }
    }

    return (sumWeight > 0.0) ? (sumValue / sumWeight) : 0.0;
}

// Détermine l'évolution de l'état de la cellule en fonction de la densité
float growth(float density) {
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

float seedNoise(vec2 uv) {
    float n = rand(uv * 100.0);
    return step(0.8, n);
}
float seedBlockNoise(vec2 uv) {
    vec2 gridUv = floor(uv * 20.0) / 20.0;
    float n = rand(gridUv);
    return step(0.1, n);
}

void main() {
    float current = texture2D(u_state, vUv).r;
    if(u_time < 0.1) {
        float s = seedNoise(vUv);
        current = max(current, s);
    }

    float density = neighborhood(vUv);
    float g = growth(density);
    float next = current + u_dt * g;
    next = clamp(next, 0.0, 1.0);

    gl_FragColor = vec4(next, 0.0, 0.0, 1.0);
}
