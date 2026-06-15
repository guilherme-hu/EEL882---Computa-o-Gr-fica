class SecretShape {
	constructor() {
		this.phase = 'ROTATE'; // Fases: 'ROTATE', 'CHOOSE'
		this.timer = 0;
		this.durationRotate = 240; // 4 segundos para rodar a forma e observar
		this.durationChoose = 240; // 4 segundos para escolher

		this.rotX = 0;
		this.rotY = 0;
		
		this.result = null;
		this.wrongChoiceIndex = -1;
		this.confetti = [];
		
		this.shapes = [
			{ id: 'cube', draw: () => box(120) },
			{ id: 'sphere', draw: () => sphere(80) },
			{ id: 'cylinder', draw: () => cylinder(60, 150) },
			{ id: 'cone', draw: () => cone(70, 150) },
			{ id: 'torus', draw: () => torus(60, 25) },
			{ id: 'truncPyramid', draw: () => this.drawTruncatedPyramid(40, 80, 140) }, // Custom
			{ id: 'cuica', draw: () => this.drawCuica() }, // Custom
			{ id: 'mushroom', draw: () => this.drawMushroom() } // Outra forma custom
		];
		
		// Embaralha as formas e escolhe 3
		let shuffled = this.shuffleArray([...this.shapes]);
		this.options = shuffled.slice(0, 3);
		
		// A forma secreta é uma das 3 escolhidas
		this.correctIndex = floor(random(3));
		this.correctShape = this.options[this.correctIndex];
		
		if (typeof music_secretshape !== 'undefined') {
			music_secretshape.play();
		}
		
		// OTIMIZAÇÃO: A função text() no p5.js WEBGL gera uma imagem invisível nova a cada frame. 
		// Para o jogo ficar a 60 FPS, precisamos criar a imagem do texto 1 vez e desenhá-la sempre.
		this.gfxGire = this.createTextGraphic("GIRE!");
		this.gfxEscolha = this.createTextGraphic("ESCOLHA!");
		this.gfxCerto = this.createTextGraphic("CERTO!");
		this.gfxErrado = this.createTextGraphic("ERRADO!");
	}

	createTextGraphic(txt) {
		let gfx = createGraphics(600, 150);
		gfx.textAlign(CENTER, CENTER);
		gfx.textSize(80);
		gfx.textFont("'Orbitron', sans-serif");
		gfx.textStyle(BOLD);
		gfx.stroke(0);
		gfx.strokeWeight(5);
		gfx.fill(255);
		gfx.text(txt, 300, 75);
		
		// Converte para imagem estática da GPU para não pesar a CPU
		let img = createImage(gfx.width, gfx.height);
		img.copy(gfx, 0, 0, gfx.width, gfx.height, 0, 0, gfx.width, gfx.height);
		return img;
	}

	shuffleArray(array) {
		for (let i = array.length - 1; i > 0; i--) {
			let j = Math.floor(Math.random() * (i + 1));
			[array[i], array[j]] = [array[j], array[i]];
		}
		return array;
	}

	// === FORMAS CUSTOMIZADAS ===
	
	drawTruncatedPyramid(topR, bottomR, h) {
		push();
		beginShape(QUADS);
		let halfH = h / 2;
		
		// Top
		vertex(-topR, -halfH, -topR);
		vertex( topR, -halfH, -topR);
		vertex( topR, -halfH,  topR);
		vertex(-topR, -halfH,  topR);
		
		// Bottom
		vertex(-bottomR, halfH, -bottomR);
		vertex( bottomR, halfH, -bottomR);
		vertex( bottomR, halfH,  bottomR);
		vertex(-bottomR, halfH,  bottomR);
		
		// Front
		vertex(-topR, -halfH, topR);
		vertex( topR, -halfH, topR);
		vertex( bottomR, halfH, bottomR);
		vertex(-bottomR, halfH, bottomR);
		
		// Right
		vertex( topR, -halfH, topR);
		vertex( topR, -halfH, -topR);
		vertex( bottomR, halfH, -bottomR);
		vertex( bottomR, halfH,  bottomR);
		
		// Back
		vertex( topR, -halfH, -topR);
		vertex(-topR, -halfH, -topR);
		vertex(-bottomR, halfH, -bottomR);
		vertex( bottomR, halfH, -bottomR);
		
		// Left
		vertex(-topR, -halfH, -topR);
		vertex(-topR, -halfH,  topR);
		vertex(-bottomR, halfH,  bottomR);
		vertex(-bottomR, halfH, -bottomR);
		
		endShape();
		pop();
	}
	
	drawCuica() {
		push();
		// Corpo da cuíca
		cylinder(50, 100); 
		// Vareta no meio
		translate(0, -70, 0);
		cylinder(5, 60);
		pop();
	}

	drawMushroom() {
		push();
		// Caule
		translate(0, 30, 0);
		cylinder(20, 60);
		// Chapéu
		translate(0, -30, 0);
		sphere(60, 24, 16, 0, PI); // Metade de uma esfera
		pop();
	}

	// === LOOP PRINCIPAL DO MICROGAME ===

	draw() {
		this.timer += dt; // Incrementa baseado no tempo real, não frames brutos
		
		// Fundo verde como na referência
		background(140, 190, 80);
		
		if (this.phase === 'ROTATE') {
			this.drawRotatePhase();
			if (this.timer >= this.durationRotate) {
				this.phase = 'CHOOSE';
				this.timer = 0; 
			}
		} else if (this.phase === 'CHOOSE') {
			this.drawChoosePhase();
			// Em vez do timer estático, o tempo do microgame é definido pela música
			if (typeof music_secretshape !== 'undefined' && !music_secretshape.isPlaying() && this.timer > 30) {
				// Acabou a música e não escolheu = Derrota!
				loseMicrogame();
			}
		} else if (this.phase === 'REVEAL') {
			this.drawRevealPhase();
			// Na fase Reveal, aguardamos pacientemente a música acabar para finalizar o microgame
			if (typeof music_secretshape !== 'undefined' && !music_secretshape.isPlaying() && this.timer > 30) {
				if (this.result === 'WIN') {
					winMicrogame();
				} else {
					loseMicrogame();
				}
			}
		}
		
		// Transição de Íris Fechando (Retorno para o Hub) no final do jogo
		if (typeof music_secretshape !== 'undefined' && music_secretshape.isPlaying()) {
			let timeLeft = music_secretshape.duration() - music_secretshape.currentTime();
			// Faltando 0.35 segundos (rápido!), fecha a Íris em direção à estrela
			if (timeLeft > 0 && timeLeft < 0.35) {
				let progress = timeLeft / 0.35; // Vai de 1 até 0
				progress = Math.pow(progress, 3); // ease-in (acelera no final)
				if (typeof drawIris === 'function') {
					drawIris(progress * 3, 0, height * 0.1, true);
				}
			}
		}
	}
	
	drawRotatePhase() {
		// Desenha "Gire!" em 2D na frente de tudo
		push();
		resetMatrix();
		ortho(-width / 2, width / 2, height / 2, -height / 2, 0, 1000);
		noLights(); // Garante que o texto fique sólido
		imageMode(CENTER);
		scale(1, -1); // Em WEBGL a imagem desenha de ponta cabeça
		image(this.gfxGire, 0, height / 4);
		pop();
		
		// Desenha o Pedestal
		push();
		noStroke();
		translate(0, 150, 0);
		
		ambientLight(150);
		directionalLight(255, 255, 255, 0, 1, -1);
		
		fill(200);
		cylinder(200, 20, 8); // Base octogonal
		translate(0, 80, 0);
		cylinder(80, 150, 8); // Pilar
		pop();
		
		// Desenha a Forma Secreta
		push();
		noStroke();
		translate(0, -50, 0);
		
		// Aplica a rotação do mouse
		rotateX(this.rotX);
		rotateY(this.rotY);
		
		// Configurações para silhueta perfeita preta
		noLights(); 
		fill(0);
		
		this.correctShape.draw();
		pop();
	}
	
	drawChoosePhase() {
		// Desenha texto e barra de tempo em 2D
		push();
		resetMatrix();
		ortho(-width / 2, width / 2, height / 2, -height / 2, 0, 1000);
		
		noLights();
		
		imageMode(CENTER);
		scale(1, -1); // Arrumar eixo Y da imagem
		image(this.gfxEscolha, 0, height / 3);
		scale(1, -1); // Desinverter para desenhar a barra corretamente
		
		// Barra de tempo sincronizada com a música!
		let progress = 1.0;
		if (typeof music_secretshape !== 'undefined' && music_secretshape.duration() > 0) {
			progress = 1.0 - (music_secretshape.currentTime() / music_secretshape.duration());
		}
		let barW = map(progress, 0, 1, 0, 400);
		noStroke();
		fill(255, 50, 0);
		rect(-200, -height / 3 + 80, barW, 20, 10);
		
		pop();
		
		// Desenha as 3 Opções lado a lado
		let spacing = min(width / 3.5, 300);
		
		for (let i = 0; i < 3; i++) {
			push();
			translate((i - 1) * spacing, 50, 0);
			
			// Fundo da opção (Painel quadrado branco)
			push();
			noStroke();
			ambientLight(255);
			fill(255);
			box(spacing * 0.8, spacing * 0.8, 10);
			pop();
			
			// Desenha a forma 3D iluminada
			push();
			translate(0, 0, 40); // Traz a forma um pouco pra frente do painel
			
			// Iluminação normal do jogo
			ambientLight(150);
			directionalLight(255, 255, 255, 0.5, 1, -0.5);
			
			fill(255, 200, 50); // Cor amarelada/alaranjada para destacar
			noStroke();
			
			// Leve rotação contínua para apresentação da forma
			rotateX(globalTime * 0.01);
			rotateY(globalTime * 0.015);
			
			// Diminui um pouco a escala para caber bem no painel
			scale(0.6);
			this.options[i].draw();
			
			pop();
			pop();
		}
	}
	
	drawRevealPhase() {
		if (this.result === 'WIN') {
			// Fundo de vitória alegre
			background(100, 200, 255);
			
			// Forma real, iluminada e gigante no centro
			push();
			translate(0, 0, 0);
			ambientLight(200);
			directionalLight(255, 255, 255, 0.5, 1, -0.5);
			fill(255, 200, 50); 
			noStroke();
			rotateX(globalTime * 0.02);
			rotateY(globalTime * 0.03);
			scale(1.5);
			this.correctShape.draw();
			pop();
			
			this.drawConfetti();
			
			// Texto
			push();
			resetMatrix();
			ortho(-width/2, width/2, height/2, -height/2, 0, 1000);
			noLights();
			imageMode(CENTER);
			scale(1, -1);
			image(this.gfxCerto, 0, height/3);
			pop();
			
		} else {
			// Fundo de erro
			background(140, 190, 80);
			
			// Texto
			push();
			resetMatrix();
			ortho(-width/2, width/2, height/2, -height/2, 0, 1000);
			noLights();
			imageMode(CENTER);
			scale(1, -1);
			image(this.gfxErrado, 0, height/3);
			pop();
			
			// Mostrar a forma real iluminada em cima
			push();
			translate(0, -100, 0);
			ambientLight(150);
			directionalLight(255, 255, 255, 0, 1, -1);
			fill(255, 200, 50);
			noStroke();
			rotateX(globalTime * 0.01);
			rotateY(globalTime * 0.02);
			this.correctShape.draw();
			pop();
			
			// Opções com o X vermelho na que errou
			let spacing = min(width / 3.5, 300);
			for (let i = 0; i < 3; i++) {
				push();
				translate((i - 1) * spacing, 80, 0); // Levemente mais abaixo
				
				push();
				noStroke(); ambientLight(255); fill(255);
				box(spacing * 0.8, spacing * 0.8, 10);
				pop();
				
				push();
				translate(0, 0, 40);
				ambientLight(150); directionalLight(255, 255, 255, 0.5, 1, -0.5);
				fill(255, 200, 50); noStroke();
				rotateX(globalTime * 0.01); rotateY(globalTime * 0.015);
				scale(0.6);
				this.options[i].draw();
				pop();
				
				// X na escolha errada
				if (i === this.wrongChoiceIndex) {
					push();
					translate(0, 0, 60);
					fill(255, 0, 0); noStroke();
					rotateZ(PI/4);
					box(15, spacing * 0.8, 15);
					rotateZ(PI/2);
					box(15, spacing * 0.8, 15);
					pop();
				}
				pop();
			}
		}
	}
	
	createConfetti() {
		for (let i = 0; i < 150; i++) {
			this.confetti.push({
				x: random(-width/2, width/2),
				y: random(-height, -height/2), // começa caindo do teto
				z: random(-100, 100),
				vx: random(-2, 2),
				vy: random(5, 15), // velocidade de queda
				vz: random(-2, 2),
				rotX: random(PI), rotY: random(PI), rotZ: random(PI),
				rotSpeedX: random(-0.2, 0.2), rotSpeedY: random(-0.2, 0.2), rotSpeedZ: random(-0.2, 0.2),
				color: color(random(255), random(255), random(255))
			});
		}
	}
	
	drawConfetti() {
		noLights(); // Flat design pros confetes
		for (let c of this.confetti) {
			c.x += c.vx * dt;
			c.y += c.vy * dt;
			c.z += c.vz * dt;
			c.rotX += c.rotSpeedX * dt;
			c.rotY += c.rotSpeedY * dt;
			c.rotZ += c.rotSpeedZ * dt;
			
			push();
			translate(c.x, c.y, c.z);
			rotateX(c.rotX);
			rotateY(c.rotY);
			rotateZ(c.rotZ);
			fill(c.color);
			noStroke();
			plane(20, 20); // formato do confete
			pop();
		}
	}
	
	// === EVENTOS ===
	
	mouseDragged() {
		if (this.phase === 'ROTATE') {
			this.rotY += (mouseX - pmouseX) * 0.01;
			this.rotX += (mouseY - pmouseY) * 0.01;
		}
	}
	
	mousePressed() {
		if (this.phase === 'CHOOSE') {
			let spacing = min(width / 3.5, 300);
			// Centro da tela é x=0. As opções estão em:
			// -spacing, 0, +spacing
			// Mapeando a coordenada X do mouse (que vai de 0 a width) 
			// para a coordenada X WebGL (que vai de -width/2 a width/2)
			let webglX = mouseX - width / 2;
			
			// Margem de tolerância (largura do painel)
			let panelHalfW = (spacing * 0.8) / 2;
			
			let selectedOption = -1;
			if (webglX > -spacing - panelHalfW && webglX < -spacing + panelHalfW) {
				selectedOption = 0;
			} else if (webglX > -panelHalfW && webglX < panelHalfW) {
				selectedOption = 1;
			} else if (webglX > spacing - panelHalfW && webglX < spacing + panelHalfW) {
				selectedOption = 2;
			}
			
			if (selectedOption !== -1) {
				this.phase = 'REVEAL'; // Entra na fase de espera/revelação
				if (selectedOption === this.correctIndex) {
					this.result = 'WIN';
					this.createConfetti();
				} else {
					this.result = 'LOSE';
					this.wrongChoiceIndex = selectedOption;
				}
			}
		}
	}
}
