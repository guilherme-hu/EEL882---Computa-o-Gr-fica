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
		
		this.initShapes();
		
		// Lógica nova para garantir probabilidade uniforme para todos os sólidos (chance exata de 1/12)
		// 1. Sorteia a forma secreta de todo o pool disponível
		this.correctShape = this.shapesInfo[Math.floor(Math.random() * this.shapesInfo.length)];
		
		// 2. Escolhe uma das classes válidas dessa forma para balizar as opções falsas
		this.chosenClass = this.correctShape.classes[Math.floor(Math.random() * this.correctShape.classes.length)];
		
		// 3. Pega todas as formas que compartilham essa classe (para o usuário se confundir)
		let validShapes = this.shapesInfo.filter(s => s.classes.indexOf(this.chosenClass) !== -1);
		
		// 4. Remove a forma correta da lista de opções falsas
		validShapes = validShapes.filter(s => s.id !== this.correctShape.id);
		
		// 5. Embaralha as outras formas válidas e pega 2 opções
		validShapes = this.shuffleArray([...validShapes]);
		let wrongOptions = validShapes.slice(0, 2);
		
		// 6. Junta a forma correta com as erradas e embaralha a ordem na tela
		this.options = this.shuffleArray([this.correctShape, ...wrongOptions]);
		this.correctIndex = this.options.findIndex(s => s.id === this.correctShape.id);
		
		// Define a rotação base dependendo da classe (para que o objeto sempre comece olhando para a câmera na pose ideal)
		let rot = this.correctShape.rotations[this.chosenClass];
		this.baseRotX = rot.rx;
		this.baseRotY = rot.ry;
		
		// Rotação acumulada pelo mouse (começa zerada para evitar gimbal lock)
		this.rotX = 0;
		this.rotY = 0;
		
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

	initShapes() {
		this.shapesInfo = [
			{
				id: 'cube',
				classes: ['Quad'],
				draw: () => box(120),
				rotations: { 'Quad': {rx: 0, ry: 0} }
			},
			{
				id: 'paralelepipedo',
				classes: ['Quad'],
				draw: () => box(120, 120, 240),
				rotations: { 'Quad': {rx: 0, ry: 0} }
			},
			{
				id: 'truncPyramid',
				classes: ['Quad'],
				draw: () => this.drawTruncatedPyramid(30, 60, 150),
				rotations: { 'Quad': {rx: -HALF_PI, ry: 0} }
			},
			{
				id: 'losango',
				classes: ['Quad'],
				draw: () => this.drawLosango(60, 160),
				rotations: { 'Quad': {rx: -HALF_PI, ry: 0} } // Padronizado para -HALF_PI
			},
			{
				id: 'sphere',
				classes: ['Circ'],
				draw: () => sphere(60),
				rotations: { 'Circ': {rx: 0, ry: 0} }
			},
			{
				id: 'elipsoide',
				classes: ['Circ'],
				draw: () => ellipsoid(60, 120, 60),
				rotations: { 'Circ': {rx: -HALF_PI, ry: 0} } // Padronizado
			},
			{
				id: 'seta',
				classes: ['Circ'],
				draw: () => this.drawSeta(25, 100, 60, 60),
				rotations: { 'Circ': {rx: -HALF_PI, ry: 0} }
			},
			{
				id: 'cylinder',
				classes: ['Quad', 'Circ'],
				draw: () => cylinder(60, 120),
				rotations: { 'Quad': {rx: 0, ry: 0}, 'Circ': {rx: -HALF_PI, ry: 0} } // Padronizado
			},
			{
				id: 'cone',
				classes: ['Piram', 'Circ'],
				draw: () => cone(60, 120),
				rotations: { 'Piram': {rx: 0, ry: 0}, 'Circ': {rx: -HALF_PI, ry: 0} }
			},
			{
				id: 'squarePyramid',
				classes: ['Piram', 'Quad'],
				draw: () => { push(); rotateY(PI/4); this.drawSquarePyramid(60, 120); pop(); },
				rotations: { 'Piram': {rx: 0, ry: 0}, 'Quad': {rx: -HALF_PI, ry: 0} }
			},
			{
				id: 'tetraedro',
				classes: ['Piram'],
				draw: () => { push(); rotateY(-PI/6); this.drawTetrahedron(69.3, 120); pop(); },
				rotations: { 'Piram': {rx: 0, ry: 0} }
			},
			{
				id: 'coneTruncado',
				classes: ['Circ'],
				draw: () => this.drawTruncatedCone(60, 30, 120),
				rotations: { 'Circ': {rx: -HALF_PI, ry: 0} }
			}
		];
	}

	createTextGraphic(txt) {
		let gfx = createGraphics(800, 200);
		gfx.clear();
		gfx.fill(0); // Cor preta
		gfx.textAlign(CENTER, CENTER);
		gfx.textFont('Georgia');
		gfx.textSize(120);
		gfx.textStyle(NORMAL);
		gfx.text(txt, 400, 100);
		
		return gfx;
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
	
	drawSquarePyramid(r, h) {
		push();
		let halfH = h / 2;
		beginShape(TRIANGLES);
		// Front
		vertex(0, -halfH, 0); vertex(-r, halfH, r); vertex(r, halfH, r);
		// Right
		vertex(0, -halfH, 0); vertex(r, halfH, r); vertex(r, halfH, -r);
		// Back
		vertex(0, -halfH, 0); vertex(r, halfH, -r); vertex(-r, halfH, -r);
		// Left
		vertex(0, -halfH, 0); vertex(-r, halfH, -r); vertex(-r, halfH, r);
		endShape();
		beginShape(QUADS);
		// Bottom
		vertex(-r, halfH, r); vertex(r, halfH, r); vertex(r, halfH, -r); vertex(-r, halfH, -r);
		endShape();
		pop();
	}
	
	drawTetrahedron(r, h) {
		push();
		let halfH = h / 2;
		let a1 = 0;
		let a2 = TWO_PI / 3;
		let a3 = 2 * TWO_PI / 3;
		let x1 = r * cos(a1); let z1 = r * sin(a1);
		let x2 = r * cos(a2); let z2 = r * sin(a2);
		let x3 = r * cos(a3); let z3 = r * sin(a3);
		
		beginShape(TRIANGLES);
		// Faces laterais
		vertex(0, -halfH, 0); vertex(x1, halfH, z1); vertex(x2, halfH, z2);
		vertex(0, -halfH, 0); vertex(x2, halfH, z2); vertex(x3, halfH, z3);
		vertex(0, -halfH, 0); vertex(x3, halfH, z3); vertex(x1, halfH, z1);
		// Base
		vertex(x1, halfH, z1); vertex(x3, halfH, z3); vertex(x2, halfH, z2);
		endShape();
		pop();
	}
	
	drawSeta(cylR, cylH, coneR, coneH) {

		// base do cilindro
		push();
		translate(0, cylH/2, 0);
		cylinder(cylR, cylH);
		pop();
		// ponta do cone
		push();
		translate(0, -coneH/2, 0);
		rotateX(PI);
		cone(coneR, coneH);
		pop();
	}

	drawLosango(r, h) {
		push();
		rotateY(PI/4);
		// pirâmide de cima
		push();
		translate(0, -h/4, 0);
		this.drawSquarePyramid(r, h/2);
		pop();
		// pirâmide de baixo
		push();
		translate(0, h/4, 0);
		rotateX(PI);
		this.drawSquarePyramid(r, h/2);
		pop();
		pop();
	}

	drawTruncatedCone(bottomR, topR, h) {
		push();
		let detail = 24;
		let halfH = h / 2;
		
		// Superfície lateral
		beginShape(TRIANGLE_STRIP);
		for (let i = 0; i <= detail; i++) {
			let angle = map(i, 0, detail, 0, TWO_PI);
			let xTop = cos(angle) * topR;
			let zTop = sin(angle) * topR;
			let xBot = cos(angle) * bottomR;
			let zBot = sin(angle) * bottomR;
			
			// Normal
			let ny = (bottomR - topR) / h;
			let nx = cos(angle);
			let nz = sin(angle);
			let mag = sqrt(nx*nx + ny*ny + nz*nz);
			normal(nx/mag, ny/mag, nz/mag);
			
			vertex(xTop, -halfH, zTop);
			vertex(xBot, halfH, zBot);
		}
		endShape();
		
		// Tampa superior
		beginShape(TRIANGLE_FAN);
		normal(0, -1, 0);
		vertex(0, -halfH, 0);
		for (let i = 0; i <= detail; i++) {
			let angle = map(i, 0, detail, TWO_PI, 0);
			vertex(cos(angle) * topR, -halfH, sin(angle) * topR);
		}
		endShape();
		
		// Tampa inferior
		beginShape(TRIANGLE_FAN);
		normal(0, 1, 0);
		vertex(0, halfH, 0);
		for (let i = 0; i <= detail; i++) {
			let angle = map(i, 0, detail, 0, TWO_PI);
			vertex(cos(angle) * bottomR, halfH, sin(angle) * bottomR);
		}
		endShape();
		
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
		// Desenha "Gire!" em 2D na frente de tudo, com fade out
		if (this.timer < 60) {
			push();
			resetMatrix();
			let alpha = map(this.timer, 0, 60, 255, 0);
			tint(255, alpha);
			imageMode(CENTER);
			image(this.gfxGire, 0, -150);
			pop();
		}
		
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
		
		// Aplica a rotação do mouse (Turntable base zero)
		rotateX(this.rotX);
		rotateY(this.rotY);
		
		// Aplica a rotação base para orientar a forma
		rotateX(this.baseRotX);
		rotateY(this.baseRotY);
		
		// Configurações para silhueta perfeita preta
		noLights(); 
		fill(0);
		
		this.correctShape.draw();
		pop();
	}
	
	drawChoosePhase() {
		// Barra de tempo sincronizada com a música! (Posicionada igual WhackABump)
		push();
		resetMatrix();
		let progress = 1.0;
		if (typeof music_secretshape !== 'undefined' && music_secretshape.duration() > 0) {
			progress = 1.0 - (music_secretshape.currentTime() / music_secretshape.duration());
		}
		progress = constrain(progress, 0, 1);
		let barW = map(progress, 0, 1, 0, 600);
		noStroke();
		fill(255, 50, 0);
		rectMode(CORNER);
		rect(-300, height/2 - 40, barW, 20, 10);
		pop();
		
		// Texto instrucional com fade out
		if (this.timer < 60) {
			push();
			resetMatrix();
			let alpha = map(this.timer, 0, 60, 255, 0);
			tint(255, alpha);
			imageMode(CENTER);
			image(this.gfxEscolha, 0, -150);
			pop();
		}
		
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
			
			// Iluminação direcional forte de um lado para criar alto contraste nas faces planas
			ambientLight(100);
			directionalLight(255, 255, 255, 1, 0.5, -1);
			
			fill(255, 200, 50); // Cor amarelada/alaranjada para destacar
			noStroke();
			
			// Leve rotação contínua para apresentação da forma
			rotateX(globalTime * 0.01);
			rotateY(globalTime * 0.015);
			
			// Aplica a rotação base para que a forma fique na pose da classe correspondente
			let bRot = this.options[i].rotations[this.chosenClass];
			if (bRot) {
				rotateX(bRot.rx);
				rotateY(bRot.ry);
			}
			
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
			
			rotateX(this.baseRotX);
			rotateY(this.baseRotY);
			
			scale(1.5);
			this.correctShape.draw();
			pop();
			
			this.drawConfetti();
			
			// Texto
			if (this.timer < 60) {
				push();
				resetMatrix();
				let alpha = map(this.timer, 0, 60, 255, 0);
				tint(255, alpha);
				imageMode(CENTER);
				image(this.gfxCerto, 0, -150);
				pop();
			}
			
		} else {
			// Fundo de erro
			background(140, 190, 80);
			
			// Texto
			if (this.timer < 60) {
				push();
				resetMatrix();
				let alpha = map(this.timer, 0, 60, 255, 0);
				tint(255, alpha);
				imageMode(CENTER);
				image(this.gfxErrado, 0, -150);
				pop();
			}
			
			// Mostrar a forma real iluminada em cima
			push();
			translate(0, -100, 0);
			ambientLight(60);
			directionalLight(255, 255, 255, 1, 0.5, -1);
			fill(255, 200, 50);
			noStroke();
			rotateX(globalTime * 0.01);
			rotateY(globalTime * 0.02);
			
			rotateX(this.baseRotX);
			rotateY(this.baseRotY);
			
			this.correctShape.draw();
			pop();
			
			// Opções com o X vermelho na que errou
			let spacing = min(width / 3.5, 300);
			for (let i = 0; i < 3; i++) {
				push();
				translate((i - 1) * spacing, 80, 350); // Levemente mais abaixo
				
				// Se for a escolha errada, aplica tremor (shake)
				if (i === this.wrongChoiceIndex) {
					translate(random(-15, 15), random(-15, 15), 0);
				}
				
				push();
				noStroke(); ambientLight(255); 
				
				// Cor do painel
				if (i === this.wrongChoiceIndex) {
					fill(255, 50, 50); // Painel vermelho vivo indicando erro
				} else if (i === this.correctIndex) {
					let pulse = map(sin(frameCount * 0.15), -1, 1, 100, 255);
					fill(50, pulse, 50); // Painel verde pulsante para ensinar a certa
				} else {
					fill(255); // Painel branco normal
				}
				
				box(spacing * 0.8, spacing * 0.8, 10);
				pop();
				
				push();
				translate(0, 0, 40);
				ambientLight(60); directionalLight(255, 255, 255, 1, 0.5, -1);
				
				// Cor do objeto: escurece o errado, mantém o certo
				if (i === this.wrongChoiceIndex) {
					fill(100, 20, 20); // Escurece o objeto que você clicou errado
				} else {
					fill(255, 200, 50); 
				}
				
				noStroke();
				rotateX(globalTime * 0.01); rotateY(globalTime * 0.015);
				
				let bRot = this.options[i].rotations[this.chosenClass];
				if (bRot) {
					rotateX(bRot.rx);
					rotateY(bRot.ry);
				}
				
				scale(0.6);
				this.options[i].draw();
				pop();
				
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
			this.rotX -= (mouseY - pmouseY) * 0.01; // Restaura a rotação intuitiva (pitch correto)
			
			// Trava o eixo X para evitar o Gimbal Lock matemático (que engole o eixo Y)
			this.rotX = constrain(this.rotX, -1.2, 1.2); 
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
					if (typeof playWinVoiceline === 'function') playWinVoiceline();
				} else {
					this.result = 'LOSE';
					this.wrongChoiceIndex = selectedOption;
				}
			}
		}
	}
}
