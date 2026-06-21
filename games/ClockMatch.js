class ClockMatch {
	constructor() {
		this.phase = 'PLAY';
		this.timer = 0;
		this.result = null;
		this.confetti = [];
		
		// Alvo (qualquer hora 0-23, qualquer minuto 0-59)
		this.targetH = floor(random(24));
		this.targetM = floor(random(60));
		
		// O ponteiro das horas move-se gradualmente conforme os minutos passam
		this.targetAngleH = (this.targetH % 12) * (TWO_PI / 12) + this.targetM * (TWO_PI / (12 * 60));
		this.targetAngleM = this.targetM * (TWO_PI / 60);
		
		// Ponteiros iniciais aleatórios (garantindo que não nasçam na posição correta)
		this.playerAngleH = (this.targetAngleH + PI + random(-1, 1)) % TWO_PI;
		this.playerAngleM = (this.targetAngleM + PI + random(-1, 1)) % TWO_PI;
		if (this.playerAngleH < 0) this.playerAngleH += TWO_PI;
		if (this.playerAngleM < 0) this.playerAngleM += TWO_PI;
		
		this.selectedHand = null; // 'H' ou 'M'
		
		this.gfxTime = this.createTextGraphic(this.formatTime(this.targetH, this.targetM));
		this.gfxNumbers = this.createNumbersGraphic();
		this.gfxInstruction = this.createInstructionGraphic();
		
		if (typeof music_clockmatch !== 'undefined') {
			music_clockmatch.play();
		}
	}
	
	formatTime(h, m) {
		let sh = h < 10 ? '0' + h : h;
		let sm = m < 10 ? '0' + m : m;
		return sh + ':' + sm;
	}
	
	createTextGraphic(txt) {
		let gfx = createGraphics(400, 150);
		gfx.clear();
		gfx.fill(0, 255, 50); // Verde digital forte
		gfx.textAlign(CENTER, CENTER);
		gfx.textFont("'Orbitron', Courier New");
		gfx.textSize(100);
		gfx.textStyle(BOLD);
		gfx.text(txt, 200, 75);
		return gfx;
	}
	
	createNumbersGraphic() {
		let gfx = createGraphics(360, 360);
		gfx.clear();
		gfx.fill(0);
		gfx.textAlign(CENTER, CENTER);
		gfx.textFont("'Orbitron', Courier New");
		gfx.textSize(48);
		gfx.textStyle(BOLD);
		// Posicionando no raio ~100 para não encostar nos marcadores
		gfx.text("12", 180, 80);
		gfx.text("6", 180, 280);
		gfx.text("3", 280, 180);
		gfx.text("9", 80, 180);
		return gfx;
	}
	
	createInstructionGraphic() {
		let gfx = createGraphics(800, 200);
		gfx.clear();
		gfx.fill(255, 255, 0);
		gfx.textAlign(CENTER, CENTER);
		gfx.textFont("'Orbitron', Courier New");
		gfx.textSize(80);
		gfx.textStyle(BOLD);
		// Sombra
		gfx.fill(0);
		gfx.text("Acerte a Hora!", 404, 104);
		gfx.fill(0, 255, 255); // Ciano em vez de amarelo
		gfx.text("Acerte a Hora!", 400, 100);
		return gfx;
	}
	
	drawFace() {
		// Borda escura do relógio
		push();
		fill(50);
		noStroke();
		rotateX(HALF_PI);
		cylinder(185, 18, 48); // 48 de detalhe para ficar bem redondo
		pop();
		
		// Fundo branco do relógio
		push();
		fill(240);
		noStroke();
		translate(0, 0, 1); // Um tiquinho pra frente para não dar z-fighting
		rotateX(HALF_PI);
		cylinder(180, 20, 48);
		pop();
		
		// Marcadores de hora
		push();
		translate(0, 0, 11);
		fill(0);
		noStroke();
		for (let i = 0; i < 12; i++) {
			push();
			rotateZ(i * TWO_PI / 12);
			translate(0, -150, 0); // Puxa pra borda
			if (i % 3 === 0) {
				box(10, 30, 5); // 12, 3, 6, 9 maiores
			} else {
				box(5, 15, 5);
			}
			pop();
		}
		pop();
		
		// Textura dos Números Principais
		push();
		translate(0, 0, 12);
		noLights();
		noStroke();
		texture(this.gfxNumbers);
		plane(360, 360);
		pop();
	}
	
	drawHand(s) {
		push();
		noStroke();
		// Transforma s em tamanho (raio base = 150)
		let len = s * 150;
		// Translada para que a base fique na origem (0,0) e aponte para "cima" (-Y)
		translate(0, -len / 2, 0);
		box(10, len, 5);
		pop();
	}
	
	// Desenha ponteiros e pino central
	drawTime() {
		push();
		translate(0, 0, 15); // Levanta levemente o ponteiro da face
		
		// Ponteiro das Horas (tamanho 0.4)
		push();
		rotateZ(this.playerAngleH);
		if (this.selectedHand === 'H') fill(255, 100, 100); // Destaque ao segurar
		else fill(200, 0, 0);
		this.drawHand(0.4);
		pop();
		
		// Ponteiro dos Minutos (tamanho 0.9)
		push();
		translate(0, 0, 5); // Acima do ponteiro de horas
		rotateZ(this.playerAngleM);
		if (this.selectedHand === 'M') fill(100, 100, 255); // Destaque ao segurar
		else fill(50);
		this.drawHand(0.9);
		pop();
		
		// Pino central
		translate(0, 0, 5);
		fill(0);
		sphere(8);
		pop();
	}
	
	draw() {
		this.timer += dt;
		
		background(80, 120, 180); // Fundo azul moderno
		
		// Barra de tempo com base na música
		push();
		resetMatrix();
		let progress = 1.0;
		if (typeof music_clockmatch !== 'undefined' && music_clockmatch.duration() > 0) {
			progress = 1.0 - (music_clockmatch.currentTime() / music_clockmatch.duration());
		}
		progress = constrain(progress, 0, 1);
		let barW = map(progress, 0, 1, 0, 600);
		noStroke();
		fill(255, 50, 0);
		rectMode(CORNER);
		rect(-300, height/2 - 40, barW, 20, 10);
		pop();
		
		// Caixa do Relógio Digital
		push();
		translate(0, -280, 0);
		ambientLight(200);
		fill(20);
		box(350, 140, 20);
		
		// Tela Verde Brilhante do Digital
		push();
		translate(0, 0, 11);
		noLights(); // Textura emissiva
		noStroke();
		texture(this.gfxTime);
		plane(350, 140);
		pop();
		pop();
		
		// Iluminação global para o relógio
		ambientLight(150);
		directionalLight(255, 255, 255, 0.5, 1, -1);
		
		// Tremor geral na tela em caso de derrota
		if (this.phase === 'REVEAL' && this.result === 'LOSE') {
			translate(random(-15, 15), random(-15, 15), 0);
		}
		
		// Desenha base e numerais
		this.drawFace();
		// Desenha ponteiros
		this.drawTime();
		
		// Efeitos Pós-Jogo (Confete ou Fundo Vermelho)
		if (this.phase === 'REVEAL') {
			if (this.result === 'WIN') {
				push();
				noLights();
				for (let c of this.confetti) {
					push();
					translate(c.x, c.y, c.z);
					rotateX(c.rotX); rotateY(c.rotY); rotateZ(c.rotZ);
					fill(c.color);
					noStroke();
					plane(15, 15);
					pop();
					c.x += c.vx * dt;
					c.y += c.vy * dt;
					c.z += c.vz * dt;
					c.rotX += c.rotSpeedX * dt;
					c.rotY += c.rotSpeedY * dt;
					c.rotZ += c.rotSpeedZ * dt;
				}
				pop();
			} else if (this.result === 'LOSE') {
				// X vermelho sobrepondo
				push();
				translate(0, 0, 100);
				fill(255, 0, 0);
				noStroke();
				rectMode(CENTER);
				rotateZ(PI/4);
				rect(0, 0, 40, 200);
				rotateZ(PI/2);
				rect(0, 0, 40, 200);
				pop();
			}
		}
		
		// Instrução de início
		if (this.phase === 'PLAY' && this.timer < 90) {
			push();
			translate(0, 0, 150);
			noLights();
			noStroke();
			let alpha = constrain(map(this.timer, 30, 90, 255, 0), 0, 255);
			tint(255, alpha);
			texture(this.gfxInstruction);
			plane(800, 200);
			tint(255, 255); // Reseta opacidade
			pop();
		}
		
		// Lógica de tempo esgotado / Vitória
		if (this.phase === 'PLAY') {
			if (typeof music_clockmatch !== 'undefined' && !music_clockmatch.isPlaying() && this.timer > 30) {
				this.phase = 'REVEAL';
				this.result = 'LOSE';
				loseMicrogame();
			}
		} else if (this.phase === 'REVEAL') {
			if (typeof music_clockmatch !== 'undefined' && !music_clockmatch.isPlaying() && this.timer > 30) {
				if (this.result === 'WIN') {
					winMicrogame();
				} else {
					loseMicrogame(); // Só de segurança para sair
				}
			}
		}
	}
	
	mousePressed() {
		if (this.phase !== 'PLAY') return;
		
		let cx = width / 2;
		let cy = height / 2;
		let dx = mouseX - cx;
		let dy = mouseY - cy;
		let d = sqrt(dx*dx + dy*dy);
		
		// Ignora se clicou muito longe
		if (d > 250) return;
		
		// Calcula qual ponteiro está mais próximo do ângulo clicado
		let mouseAngle = atan2(dy, dx) + HALF_PI;
		if (mouseAngle < 0) mouseAngle += TWO_PI;
		
		let diffH = abs(mouseAngle - this.playerAngleH);
		if (diffH > PI) diffH = TWO_PI - diffH;
		
		let diffM = abs(mouseAngle - this.playerAngleM);
		if (diffM > PI) diffM = TWO_PI - diffM;
		
		if (diffH < diffM) {
			this.selectedHand = 'H';
		} else {
			this.selectedHand = 'M';
		}
		
		this.updateHandAngle(dx, dy);
	}
	
	mouseDragged() {
		if (this.phase !== 'PLAY' || !this.selectedHand) return;
		
		let cx = width / 2;
		let cy = height / 2;
		let dx = mouseX - cx;
		let dy = mouseY - cy;
		
		this.updateHandAngle(dx, dy);
	}
	
	mouseReleased() {
		if (this.phase !== 'PLAY') return;
		this.selectedHand = null;
		this.checkWin();
	}
	
	updateHandAngle(dx, dy) {
		let mouseAngle = atan2(dy, dx) + HALF_PI;
		if (mouseAngle < 0) mouseAngle += TWO_PI;
		
		if (this.selectedHand === 'H') {
			this.playerAngleH = mouseAngle;
		} else if (this.selectedHand === 'M') {
			this.playerAngleM = mouseAngle;
		}
		
		// Verificar constantemente pra dar o trigger imediato quando acertar!
		this.checkWin();
	}
	
	checkWin() {
		let tH = this.targetAngleH % TWO_PI;
		if (tH < 0) tH += TWO_PI;
		let tM = this.targetAngleM % TWO_PI;
		if (tM < 0) tM += TWO_PI;
		
		let margin = radians(12); // Tolerância de 12 graus
		
		let diffH = abs(this.playerAngleH - tH);
		if (diffH > PI) diffH = TWO_PI - diffH;
		
		let diffM = abs(this.playerAngleM - tM);
		if (diffM > PI) diffM = TWO_PI - diffM;
		
		if (diffH <= margin && diffM <= margin) {
			this.phase = 'REVEAL';
			this.result = 'WIN';
			playWinVoiceline();
			this.createConfetti();
		}
	}
	
	createConfetti() {
		for (let i = 0; i < 150; i++) {
			this.confetti.push({
				x: random(-width/2, width/2),
				y: random(-height, -height/2),
				z: random(-100, 100),
				vx: random(-2, 2),
				vy: random(5, 15),
				vz: random(-2, 2),
				rotX: random(PI), rotY: random(PI), rotZ: random(PI),
				rotSpeedX: random(-0.2, 0.2), rotSpeedY: random(-0.2, 0.2), rotSpeedZ: random(-0.2, 0.2),
				color: color(random(255), random(255), random(255))
			});
		}
	}
}
