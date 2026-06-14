function drawHubScene() {
	// Cenário de fundo: espaço sideral
	shader(my_shader);
	my_shader.setUniform('iResolution', [width, height]);
	my_shader.setUniform('iTime', millis() / 1000.0);
	my_shader.setUniform('iMouse', [mouseX, height - mouseY, mouseIsPressed ? 1.0 : 0.0]);
	plane(width, height);

	// Nave
	if (drawShip) {
		resetShader(); // desligar shader

		push();
		
		translate(0, 50, 400); // Posicionamento base da nave na tela
		scale(min(width, height) / 800.0);  // Depende da resolução da tela
		
		rotateY( PI ); 		// Nave olhando para frente
		rotateX( PI / 12 ); // Bico voltado pra cima

		// Balanço de voo
		let floatY = sin(frameCount * 0.05) * 10;  	// Sobe e desce
		let floatX = cos(frameCount * 0.03) * 8;  	// Movimento leve para os lados
		let roll   = sin(frameCount * 0.04) * 0.1; // Tombada lateral suave nas asas
		let pitch  = cos(frameCount * 0.06) * 0.05; // Leve chacoalhada no bico
		
		translate(floatX, floatY, 0);
		rotateZ(roll);
		rotateX(pitch);

		// Iluminação
		ambientLight(150, 150, 175); 
	
		directionalLight(255, 255, 255, 0.5, 1, -0.5); // Luz branca de cima para baixo
		
		directionalLight(0, 200, 255, -0.8, -1, 0.5); // Luz ciano vindo de baixo para cima
		
		directionalLight(200, 0, 255, 0.8, -1, 0.5); // Luz magenta vindo de baixo para cima

		// Chama a função que desenha a Arwing passando o número de vidas ativas
		if (typeof drawArwing === 'function') {
			drawArwing(vidas);
		}
		
		// Desenhar Explosões (Grudadas na nave localmente)
		for (let i = explosions.length - 1; i >= 0; i--) {
			let e = explosions[i];
			let age = frameCount - e.frameStart;
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
				d.x += d.vx;
				d.y += d.vy;
				d.z += d.vz;
				
				d.vx *= 0.85;
				d.vy *= 0.85;
				d.vz *= 0.85;
				
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
		
		pop(); // Fim do espaço local da nave
		
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
		
		scale(1.8);
		
		stroke(0);
		strokeWeight(2);
		
		if (active) {
			fill(255, 80, 0);
			beginShape();
			vertex(0, 35); 
			bezierVertex(35, 5, 35, -35, 0, -35); 
			bezierVertex(-35, -35, -35, 5, 0, 35);
			endShape(CLOSE);
			
			noStroke();
			fill(255, 220, 0);
			beginShape();
			vertex(0, 15);
			bezierVertex(18, -5, 18, -25, 0, -25);
			bezierVertex(-18, -25, -18, -5, 0, 15);
			endShape(CLOSE);
			
			fill(255);
			ellipse(0, -18, 12, 12);
		}
		
		pop();
	}
	
	pop();
	perspective();
}

function performExplosion() {
	if (vidas > 0) {
		let ex, ey, ez;
		if (vidas === 4) { ex = -75; ey = 14; ez = -55; }
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
		
		explosions.push({ x: ex, y: ey, z: ez, frameStart: frameCount, life: 35, debris: debris });
		vidas--;
		if (music_derrota) music_derrota.play();
	}
}
