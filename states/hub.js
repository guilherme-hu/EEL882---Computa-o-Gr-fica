function drawHubScene() {
	
	// Fundo
	if (performanceMode === 2) {
		// MODO 2: QUALIDADE MÍNIMA (Imagem estática)
		push();
		resetMatrix();
		ortho(-width / 2, width / 2, height / 2, -height / 2, 0, 1000);
		noLights();
		if (bgImage) {
			imageMode(CENTER);
			
			// Desloca o centro da imagem e do giro para cima
			translate(0, height * 0.1);
			rotateZ(-shaderTime * 0.36);
			
			// Escala mantendo a proporção da imagem original -> menor dimensão da imagem deve cobrir a diagonal da tela
			let coverScale = sqrt(width * width + height * height) / min(bgImage.width, bgImage.height);
			coverScale *= 1.1; // Ajuste fino para garantir que cubra mesmo com rotação

			image(bgImage, 0, 0, bgImage.width * coverScale, bgImage.height * coverScale); 
		} else {
			background(10, 5, 30);
		}
		pop();
		
		perspective();
		clearDepth();
		
	} else if (performanceMode === 1) {
		// MODO 1: QUALIDADE MÉDIA (Shader renderizado em baixa resolução via bgBuffer)
		if (typeof bgBuffer !== 'undefined' && typeof bgShader !== 'undefined') {
			bgBuffer.shader(bgShader);
			bgShader.setUniform('iResolution', [bgBuffer.width, bgBuffer.height]);
			bgShader.setUniform('iTime', shaderTime);
			bgShader.setUniform('iMouse', [mouseX * bgScale, bgBuffer.height - mouseY * bgScale, mouseIsPressed ? 1.0 : 0.0]);
			bgBuffer.plane(bgBuffer.width, bgBuffer.height);

			push();
			resetMatrix();
			ortho(-width / 2, width / 2, height / 2, -height / 2, 0, 1000);
			noLights();
			imageMode(CENTER);
			scale(1, -1); // Desinverte o eixo Y para o raymarching rodar na direção e orientação corretas
			image(bgBuffer, 0, 0, width, height);
			pop();
		} else {
			background(10, 5, 30);
		}
		
		perspective();
		clearDepth();
		
	} else {
		// MODO 0: QUALIDADE MÁXIMA (Shader renderizado em resolução total)
		if (typeof my_shader !== 'undefined') {
			push();
			resetMatrix();
			ortho(-width / 2, width / 2, height / 2, -height / 2, 0, 1000);
			noLights();
			
			shader(my_shader);
			my_shader.setUniform('iResolution', [width, height]);
			my_shader.setUniform('iTime', shaderTime);
			my_shader.setUniform('iMouse', [mouseX, height - mouseY, mouseIsPressed ? 1.0 : 0.0]);
			rectMode(CENTER);
			rect(0, 0, width, height);
			
			pop();
			
			resetShader(); // Volta para o shader padrão antes de desenhar 3D
		} else {
			background(10, 5, 30);
		}
		
		perspective();
		clearDepth();
	}

	// Nave (esconde durante o Game Over definitivo)
	if (drawShip && currentState !== GameState.GAME_OVER) {
		push();
		
		translate(0, 50, 400); // Posicionamento base da nave na tela
		scale(min(width, height) / 800.0);  // Depende da resolução da tela
		
		rotateY( PI ); 		// Nave olhando para frente
		rotateX( PI / 12 ); // Bico voltado pra cima

		// ANIMAÇÃO DE ESTADOS DA NAVE
		let rotZ_extra = 0;
		let extraZ = 0;
		let extraY = 0;
		let extraX = 0;
		if (currentState === GameState.RESULT) {
			if (lastResultStatus === 'WIN') { // Animação de vitória: Giro e avanço para a tela
				if (hubTimer < 90) {
					let p = hubTimer / 90.0;
					// Função de easing (ease-in-out)
					let ease = p * p * (3.0 - 2.0 * p);
					rotZ_extra = ease * TWO_PI; // Giro de 360 graus
					extraZ = sin(p * PI) * 150; // Avança pra frente e volta suavemente
				} else {
					rotZ_extra = TWO_PI;
				}
			} else if (lastResultStatus === 'LOSE') { // Animação de derrota: Tremor e queda leve
				if (hubTimer < 90) {
					let p = hubTimer / 90.0;
					// Desce um pouco (Y cresce pra baixo)
					extraY = sin(p * PI) * 40; 
					// Tremor horizontal (eixo X)
					let shake = sin(p * PI) * 20; // Intensidade máxima no meio
					extraX = sin(hubTimer * 3.0) * shake; 
				}
			}
		} else if (currentState === GameState.PRE_GAME_OVER) { // Animação de pré-Game Over: Nave afundando e ruindo no eixo Y
			let dropProgress = hubTimer / 60.0;
			extraY = Math.pow(dropProgress, 2) * 300; // Afunda progressivamente
			let shake = min(dropProgress * 50, 60); // Aumenta o tremor até um limite
			extraX = sin(hubTimer * 4.0) * shake; // Tremor violento
			rotZ_extra = sin(hubTimer * 0.8) * 0.3; // Começa a capotar/tombar lateralmente
		}

		// Nave chegando da direção do observador
		if (shipIntroTimer > 0) {
			let p = shipIntroTimer / 60.0; // de 1 a 0
			// Easing para começar bem de trás e ir freando
			extraZ -= Math.pow(p, 3) * 1500; 
		}

		translate(extraX, extraY, extraZ);
		rotateZ(rotZ_extra);

		// Balanço de voo usando globalTime
		let floatY = sin(globalTime * 0.05) * 10;  	// Sobe e desce
		let floatX = cos(globalTime * 0.03) * 8;  	// Movimento leve para os lados
		let roll   = sin(globalTime * 0.04) * 0.1;  // Tombada lateral suave nas asas
		let pitch  = cos(globalTime * 0.06) * 0.05; // Leve chacoalhada no bico
		
		translate(floatX, floatY, 0);
		rotateZ(roll);
		rotateX(pitch);

		// Iluminação
		ambientLight(150, 150, 175); // Luz ambiente azulada para dar um tom espacial
		directionalLight(255, 255, 255, 0.5, 1, -0.5); // Luz branca de cima para baixo
		directionalLight(0, 200, 255, -0.8, -1, 0.5); // Luz ciano vindo de baixo para cima
		directionalLight(200, 0, 255, 0.8, -1, 0.5); // Luz magenta vindo de baixo para cima

		// Função que desenha a Arwing passando o número de vidas ativas
		if (typeof drawArwing === 'function') {
			drawArwing(vidas); // Vidas para decidir quais turbinas estão acesas
		}
		
		// Desenhar Explosões (Grudadas na nave localmente)
		for (let i = explosions.length - 1; i >= 0; i--) {
			let e = explosions[i];
			let age = globalTime - e.frameStart;
			if (age > e.life) {
				explosions.splice(i, 1);
				continue; // Explosão acabou
			}
			
			push();
			translate(e.x, e.y, e.z);
			noStroke();
			
			let progress = age / e.life; // Vai de 0 até 1 
			
			// Atualiza e desenha cada pequeno estilhaço
			for (let d of e.debris) {
				// Atualiza de acordo com o delta time
				d.x += d.vx * dt;
				d.y += d.vy * dt;
				d.z += d.vz * dt;
				
				// Apenas decai velocidade se tiver passando tempo
				d.vx *= Math.pow(0.85, dt);
				d.vy *= Math.pow(0.85, dt);
				d.vz *= Math.pow(0.85, dt);
				
				push();
				translate(d.x, d.y, d.z);
				
				rotateX(d.rotX + age * 0.3);
				rotateY(d.rotY + age * 0.3);
				rotateZ(d.rotZ + age * 0.3);
				
				let currentSize = d.size * (1 - progress);
				
				emissiveMaterial(d.col);
				fill(d.col);
				box(currentSize); 
				pop();
			}
			
			emissiveMaterial(0, 0, 0); 
			pop();
		}
		
		pop();
		
		// Desenhar Vidas na frente de tudo
		if (currentState !== GameState.START) {
			drawLivesHUD();
		}
	}
}

function drawLivesHUD() {
	push();
	resetMatrix();
	
	ortho(-width / 2, width / 2, height / 2, -height / 2, 0, 1000);
	
	translate(0, -height / 2 + 80, 500);
	scale(0.8 * min(width, height) / 800.0);  
	
	noLights();
	
	let spacing = 90; 
	let startX = -((4 * 60) + (3 * spacing)) / 2 + 60;
	
	for (let i = 0; i < 4; i++) {
		push();
		translate(startX + i * (60 + spacing), 0, 0);
		
		let active = (i < vidas);
		
		// Como a textura interna já foi criada com 2x de escala, escalamos apenas 0.9 para chegar nos 1.8 originais
		scale(0.9);
		
		if (active && typeof lifeGraphics !== 'undefined') {
			imageMode(CENTER);
			push();
			image(lifeGraphics, 0, 0);
			pop();
		}
		
		pop();
	}
	
	pop();
	perspective();
}

// Função para criar uma explosão na posição da nave, chamada quando turbina é destruída (perda de vidas)
function performExplosion() {
	if (vidas > 0) {
		let ex, ey, ez;
		if (vidas === 4) 	  { ex = -75; ey = 14; ez = -55; }
		else if (vidas === 3) { ex = 75; ey = 14; ez = -55; }
		else if (vidas === 2) { ex = -40; ey = 14; ez = -35; }
		else if (vidas === 1) { ex = 40; ey = 14; ez = -35; }
		
		ey += 8;
		ez -= 10;
		
		let debris = [];
		for (let j = 0; j < 15; j++) {
			debris.push({
				x: 0, y: 0, z: 0,
				vx: random(-8, 8), vy: random(-8, 8), vz: random(-8, 8),
				rotX: random(PI), rotY: random(PI), rotZ: random(PI),
				size: random(3, 7), col: random() > 0.5 ? color(255, 120, 0) : color(255, 230, 50)
			});
		}
		
		explosions.push({ x: ex, y: ey, z: ez, frameStart: globalTime, life: 35, debris: debris });
		vidas--;
		
	}
}
