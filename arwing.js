// Modelo Geométrico Low-Poly da Arwing (Star Fox)
// Ref: https://sketchfab.com/3d-models/snes-arwing-starfox-a86138d368b243938b022d8f676292a5

function buildArwingModel() {
    return buildGeometry(function() {
        noStroke();
        
        // Cores 
        let cWhite = color(230, 235, 240);       // Fuselagem topo
        let cShadow = color(170, 180, 195);      // Fuselagem baixo/sombra
        let cBlue = color(30, 80, 240);          // Aletas azuis (face externa)
        let cLightBlue = color(100, 180, 255);   // Aletas azuis (face interna/luz)
        let cDarkGrey = color(50, 55, 60);       // Frame do cockpit e canards
        let cGlass = color(100, 200, 255, 220);  // Vidro do cockpit
        let cOrange = color(255, 150, 0);        // Motor e linhas de energia
        let cDarkEngine = color(30, 30, 30);     // Fundo do motor

        // Função para criar vetores 3D
        function v(x, y, z) { return createVector(x, y, z); }
        
        // Função para desenhar um triângulo 3D com cor "col"
        function tri(v1, v2, v3, col) {
            let u = p5.Vector.sub(v2, v1);
            let w = p5.Vector.sub(v3, v1);
            let n = u.cross(w).normalize();
            
            fill(col);
            beginShape();
            normal(n.x, n.y, n.z); vertex(v1.x, v1.y, v1.z);
            normal(n.x, n.y, n.z); vertex(v2.x, v2.y, v2.z);
            normal(n.x, n.y, n.z); vertex(v3.x, v3.y, v3.z);
            endShape(CLOSE);
        }
        
        // Função para desenhar um quadrilátero 3D com cor "col"
        function quad3(v1, v2, v3, v4, col) {
            let u = p5.Vector.sub(v2, v1);
            let w = p5.Vector.sub(v4, v1);
            let n = u.cross(w).normalize();
            
            fill(col);
            beginShape();
            normal(n.x, n.y, n.z); vertex(v1.x, v1.y, v1.z);
            normal(n.x, n.y, n.z); vertex(v2.x, v2.y, v2.z);
            normal(n.x, n.y, n.z); vertex(v3.x, v3.y, v3.z);
            normal(n.x, n.y, n.z); vertex(v4.x, v4.y, v4.z);
            endShape(CLOSE);
        }

        // 1) Corpo Central (Fuselagem)
        let nose = v(0, 0, 180);
        let midL = v(-25, 0, 10);
        let midR = v(25, 0, 10);
        let midTop = v(0, -20, 10);
        let midBot = v(0, 20, 10);
        
        let tailL = v(-15, 0, -60);
        let tailR = v(15, 0, -60);
        let tailTop = v(0, -12, -60);
        let tailBot = v(0, 12, -60);

        // Frente da fuselagem (Pirâmide)
        tri(nose, midL, midTop, cWhite);
        tri(nose, midTop, midR, cWhite);
        tri(nose, midBot, midL, cWhite); 
        tri(nose, midR, midBot, cWhite);

        // Traseira da fuselagem
        quad3(midTop, midL, tailL, tailTop, cWhite);
        quad3(midTop, tailTop, tailR, midR, cWhite);
        quad3(midBot, tailBot, tailL, midL, cWhite);
        quad3(midBot, midR, tailR, tailBot, cWhite);

        // 2) Escape do Motor Traseiro Central
        quad3(tailTop, tailL, tailBot, tailR, cDarkEngine);
        
        // Fogo do Motor Principal (Triângulo Interno)
        tri(v(0, 0, -61), v(-8, 5, -61), v(8, 5, -61), cOrange);

        // 3) Cockpit (Cabine)
        let cpFront = v(0, -16, 40);
        let cpBack = v(0, -18, -20);
        let cpL = v(-12, -16, 15);
        let cpR = v(12, -16, 15);
        let cpTop = v(0, -35, 5);

        tri(cpFront, cpL, cpTop, cDarkGrey);
        tri(cpFront, cpTop, cpR, cDarkGrey);
        tri(cpBack, cpTop, cpL, cDarkGrey);
        tri(cpBack, cpR, cpTop, cDarkGrey);

        let gFront = v(0, -17, 36);
        let gBack = v(0, -19, -16);
        let gL = v(-10, -17, 15);
        let gR = v(10, -17, 15);
        let gTop = v(0, -34, 5);
        
        tri(gFront, gL, gTop, cGlass);
        tri(gFront, gTop, gR, cGlass);
        tri(gBack, gTop, gL, cGlass);
        tri(gBack, gR, gTop, cGlass);

        // 4) Asas Principais
        let wL1 = v(-25, 0, 10);    
        let wL2 = v(-110, 0, -40);  
        let wL3 = v(-130, 0, -80);  
        let wL4 = v(-70, 0, -50);   
        let wL5 = v(-80, 0, -90);   
        let wL6 = v(-15, 0, -60);   

        let wR1 = v(25, 0, 10);    
        let wR2 = v(110, 0, -40);  
        let wR3 = v(130, 0, -80);  
        let wR4 = v(70, 0, -50);   
        let wR5 = v(80, 0, -90);   
        let wR6 = v(15, 0, -60);   

        tri(wL1, wL2, wL4, cWhite);
        tri(wL2, wL3, wL4, cWhite);
        quad3(wL4, wL5, wL6, wL1, cWhite);
        
        push(); translate(0, 1, 0);
        tri(wL1, wL4, wL2, cWhite);
        tri(wL2, wL4, wL3, cWhite);
        quad3(wL4, wL1, wL6, wL5, cWhite);
        pop();

        tri(wR1, wR4, wR2, cWhite);
        tri(wR2, wR4, wR3, cWhite);
        quad3(wR4, wR1, wR6, wR5, cWhite);

        push(); translate(0, 1, 0);
        tri(wR1, wR2, wR4, cWhite);
        tri(wR2, wR3, wR4, cWhite);
        quad3(wR4, wR5, wR6, wR1, cWhite);
        pop();

        // 5) Aletas Verticais Azuis 
        let fL_TopBaseF = v(-40, 0, 0);
        let fL_TopBaseB = v(-60, 0, -40);
        let fL_TopTip   = v(-85, -60, 20); 
        
        tri(fL_TopBaseF, fL_TopTip, fL_TopBaseB, cBlue); 
        tri(fL_TopBaseF, fL_TopBaseB, fL_TopTip, cBlue);

        let fL_BotTip   = v(-65, 30, -50); 
        tri(fL_TopBaseF, fL_BotTip, fL_TopBaseB, cBlue);
        tri(fL_TopBaseF, fL_TopBaseB, fL_BotTip, cBlue);

        let fR_TopBaseF = v(40, 0, 0);
        let fR_TopBaseB = v(60, 0, -40);
        let fR_TopTip   = v(85, -60, 20);
        
        tri(fR_TopBaseF, fR_TopBaseB, fR_TopTip, cBlue);
        tri(fR_TopBaseF, fR_TopTip, fR_TopBaseB, cBlue);

        let fR_BotTip   = v(65, 30, -50);
        tri(fR_TopBaseF, fR_TopBaseB, fR_BotTip, cBlue);
        tri(fR_TopBaseF, fR_BotTip, fR_TopBaseB, cBlue);
    });
}

// Função para desenhar a Arwing
function drawArwing(activeLives = 4) {
    push();
    noStroke();
    
    // Desenha o modelo estático previamente compilado para a GPU
    if (typeof arwingModel !== 'undefined' && arwingModel) {
        model(arwingModel);
    }
    
    // Linhas de detalhe não vão no p5.Geometry, então desenhamos aqui
    let midL = createVector(-25, 0, 10);
    let midR = createVector(25, 0, 10);
    let fL_TopBaseF = createVector(-40, 0, 0);
    let fR_TopBaseF = createVector(40, 0, 0);
    let cOrange = color(255, 150, 0);
    
    stroke(cOrange);
    strokeWeight(2);
    line(midL.x, midL.y, midL.z, fL_TopBaseF.x, fL_TopBaseF.y, fL_TopBaseF.z);
    line(midR.x, midR.y, midR.z, fR_TopBaseF.x, fR_TopBaseF.y, fR_TopBaseF.z);

    noStroke();
    
    // Turbinas em baixo das asas    
    // Função para desenhar cada Turbina, depende do número de vidas ativas para decidir quais estão acesas
    function drawJetEngine(cx, cy, cz, active) {
        push();
        translate(cx, cy, cz);
        
        // Corpo da turbina (Cilindro)
        if (active) {
            ambientMaterial(180, 180, 190);
            fill(180, 180, 190); // Cinza claro (acesa/metal)
        } else {
            ambientMaterial(30, 30, 30);
            fill(30, 30, 30);    // Preta (apagada/fria)
        }
        
        push();
        rotateX(PI / 2); // Alinhar o eixo do cilindro com o eixo Z
        cylinder(6, 25, 10, 1); 
        pop();
        
        // Emissão de Efeito de Fogo -> Rastro de Partículas
        if (active) {
            push();
            translate(0, 0, -12.5); // Move para a traseira do cilindro
            noStroke();
            
            // 4 pequenos losangos que formam o rastro do jato
            for (let i = 0; i < 4; i++) {
                // Um temporizador cíclico de 0 a 20 para cada partícula, espaçadas uniformemente
                let t = (frameCount * 0.8 + i * 5) % 20; 
                
                // Mapeia a distância (0 a 30 pra trás) e o tamanho (encolhe de 5 para 0)
                let distance = map(t, 0, 20, 0, 30);
                let size = map(t, 0, 20, 5, 0);
                
                push();
                translate(0, 0, -distance);
                
                // Gira em todos os eixos para o cubo parecer uma faísca facetada
                rotateX(frameCount * 0.1 + i);
                rotateY(frameCount * 0.2 + i);
                rotateZ(frameCount * 0.3 + i);
                
                // Se a partícula estiver logo no começo (perto do motor), ela é mais quente (amarela)
                if (t < 6) {
                    emissiveMaterial(255, 230, 50);
                    fill(255, 230, 50);
                } else {
                    // Mais distante, laranja escuro
                    emissiveMaterial(255, 100, 0);
                    fill(255, 100, 0);
                }
                
                box(size);
                pop();
            }
            
            // Desliga a emissão de luz para não afetar o resto da nave
            emissiveMaterial(0, 0, 0);
            pop();
        }
        pop();
    }

    drawJetEngine(-65, 10, -75, activeLives >= 4); // Externa Esquerda (Turbina 1)
    drawJetEngine(-40, 10, -55, activeLives >= 2); // Interna Esquerda (Turbina 2)
    drawJetEngine(40, 10, -55, activeLives >= 1);  // Interna Direita (Turbina 3)
    drawJetEngine(65, 10, -75, activeLives >= 3);  // Externa Direita (Turbina 4)

    pop();
}
