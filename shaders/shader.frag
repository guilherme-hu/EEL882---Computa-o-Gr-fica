precision highp float;

uniform vec2 iResolution;
uniform vec3 iMouse;
uniform float iTime;

// Rotação 2D
mat2 rot2D(float a) {
    return mat2(cos(a), -sin(a), sin(a), cos(a));
}

// Paleta de Cores do fundo
// Fórmula: https://iquilezles.org/articles/palettes/
vec3 palette(float t) {
    vec3 a = vec3(0.2, 0.15, 0.6); // a = cor base 
    vec3 b = vec3(0.3, 0.2, 0.3); // b = contraste (quanto a cor muda ao longo do tempo)
    vec3 c = vec3(10.0, 10.0, 10.0); // c = frequência (quantas vezes a cor muda ao longo do tempo)
    vec3 d = vec3(0.5, 0.5, 0.5); // d = fase (deslocamento da cor, para evitar que todas mudem ao mesmo tempo)
    
    return a + b * cos(6.28318 * (c * t + d));
}

// SDF Esfera
float sdSphere(vec3 p, float s) {
    return length(p) - s;
}

// SDF Caixa
float sdBox(vec3 p, vec3 b) {
    vec3 q = abs(p) - b;
    return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0);
}

// SDF Cilindro
float sdCylinder(vec3 p, float h, float r) {
    vec2 d = abs(vec2(length(p.xy), p.z)) - vec2(r, h);
    return min(max(d.x, d.y), 0.0) + length(max(d, 0.0));
}

vec2 opU(vec2 d1, vec2 d2) {
    return (d1.x < d2.x) ? d1 : d2;
}

// Distância do cenário 
float map(vec3 p) {
    p.z += iTime * 0.5; // Movimento da câmera para a frente
    
    // Configurações da malha infinita (Repetição espacial)
    vec3 q = p;
    q.xy = fract(q.xy) - 0.5;     // Repete o X e Y a cada 1 unidade e desloca pro centro
    q.z =  mod(q.z, 0.1) - 0.125; // Repete o Z bem próximo (para parecer um fluxo)
    
    // Criação das esferas (como partículas espaciais)
    float obj = sdSphere(q, 0.03); 
    
    // SDF de cilindro - túnel no meio
    float k = 4.0; // Raio do túnel
    float tube = length(p.xy) - k;
    
    // Combinação das SDFs: O túnel é subtraído das esferas para criar um efeito de "buraco" no meio, e o resultado é max para manter a forma das esferas.
    return max(obj, -tube);
}

// Star
vec3 DrawStar(vec2 uv, float t) {
    // Só renderiza se o raio foi muito longe (para economizar cálculo)
    float starFade = smoothstep(15.0, 30.0, t);
    if (starFade <= 0.0) return vec3(0.0);
    
    // 1. O NÚCLEO DA ESTRELA/PORTAL (Agora é uma Elipse Vertical)
    // Multiplicar o X por um valor maior que o Y estica a forma verticalmente
    float radius = length(uv * vec2(1.0, 1.0)); 
    
    // Efeito de luz do núcleo (Glow principal)
    float starGlow = 0.05 / (radius + 0.01); 
    
    // Mistura de Cores (Núcleo Branco -> Roxo -> Azul Escuro nas bordas)
    vec3 starColor = mix(vec3(0.9, 0.95, 1.0), vec3(0.5, 0.1, 0.9), clamp(radius * 3.0, 0.0, 1.0));
    starColor = mix(starColor, vec3(0.0, 0.2, 0.9), clamp(radius * 6.0, 0.0, 1.0));
    
    // 2. OS FEIXES DE LUZ (Lens Flare)
    float flare = 0.0;
    // Feixe Horizontal (Anamorphic)
    flare += 0.01 / (abs(uv.y) * 150.0 + abs(uv.x) * 1.5 + 0.001);
    // Feixe Vertical (Ajustado para combinar com a elipse)
    flare += 0.01 / (abs(uv.x) * 150.0 + abs(uv.y) * 2.0 + 0.001);
    
    // Feixes Diagonais
    vec2 uvDiag = vec2(uv.x * 0.707 - uv.y * 0.707, uv.x * 0.707 + uv.y * 0.707);
    flare += 0.005 / (abs(uvDiag.x) * 200.0 + abs(uvDiag.y) * 15.0 + 0.001);
    flare += 0.005 / (abs(uvDiag.y) * 200.0 + abs(uvDiag.x) * 15.0 + 0.001);
    
    flare *= smoothstep(1.5, 0.0, length(uv));
    
    vec3 flareColor = vec3(0.2, 0.6, 1.0) * flare; 
    
    // Combina o núcleo, os feixes e aplica o fade de profundidade
    return (starColor * starGlow + flareColor) * starFade;
}

void main() {
    vec2 fragCoord = gl_FragCoord.xy;
    
    // Normalização
    vec2 uv = (fragCoord * 2.0 - iResolution.xy) / iResolution.y;
    
    // Translate do cenário para cima 
    uv.y -= 0.2;
    
    // Inicialização 
    vec3 ro = vec3(0.0, 0.0, -2.0);     // Origem do raio (câmera)
    vec3 rd = normalize(vec3(uv, 1.0)); // Direção do raio
    vec3 col = vec3(0.0);               // Cor final do pixel
    
    // Câmera
    // Normalizamos a posição do mouse (de -1 a 1)
    vec2 m = (iMouse.xy * 2.0 - iResolution.xy) / iResolution.y;
    if (iMouse.x == 0.0 && iMouse.y == 0.0) m = vec2(0.0); // Posição neutra inicial
    
    // Giramos a direção do raio (câmera) levemente com base no mouse
    // Isso cria o efeito de "olhar para os lados e para cima/baixo"
    rd.yz *= rot2D(m.y * 0.01); // Olha para cima/baixo
    rd.xz *= rot2D(m.x * 0.01); // Olha para os lados
    
    float t = 0.0;
    float iters = 0.0;
    
    // Raymarching
    for (int i = 0; i < 80; i++) {
        vec3 p = ro + rd * t;
        
        // Girar raio para fazer vórtice
        p.xy *= rot2D(t * 0.2 + iTime * 0.3); 
        
        // Checar a distância no mapa 3D
        float d = map(p);
        t += d;
        iters = float(i);
        
        // Otimização: Parar se colidir (<0.001) ou se for muito longe (30.0)
        if (d < 0.001 || t > 30.0) break;
    }
    

    // ILUMINAÇÃO
    if (t < 30.0) {
        // Usa a paleta cósmica baseada na distância e número de iterações do raymarching
        col = palette(t * 0.1 + iters * 0.015);
        
        // Névoa - Escurece objetos muito longe para sumirem suavemente
        float fog = smoothstep(50.0, 10.0, t);
        col *= fog;
        
        // Brilho volumétrico nas bordas das esferas
        col += vec3(0.02, 0.1, 0.4) * (iters * 0.005);
    }
    
    // Estrela no fundo do cenário
    col += DrawStar(rd.xy, t);

    gl_FragColor = vec4(col, 1.0);
}