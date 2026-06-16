class BezierMatch {
	constructor() {
		this.timer = 0;
		this.phase = 'PLAY'; 
		
		// Fix: Exactly 2 intermediate points (total 4 points, degree 3)
		this.numPoints = 4;
		
		this.targetPoints = [];
		this.playerPoints = [];
		
		this.draggingIndex = -1;
		this.hoverIndex = -1;
		this.won = false;
		this.hasMoved = false;
		this.particles = [];
		
		this.commandTimer = 60; // Tempo que a palavra fica na tela
		this.gfxText = createGraphics(800, 200);
		this.gfxText.textAlign(CENTER, CENTER);
		this.gfxText.textFont('Georgia'); // Uma fonte diferente da padrão
		this.gfxText.textSize(120);
		this.gfxText.textStyle(NORMAL); // Sem negrito
		this.gfxText.fill(0); // Preto
		this.gfxText.noStroke(); // Sem borda branca
		this.gfxText.text("MOLDE!", 400, 100);
		
		this.generatePoints();
		
		if (typeof audio_beziermatch !== 'undefined' && audio_beziermatch) {
			audio_beziermatch.play();
		}
	}
	
	generatePoints() {
		// p0 (start) - Increased area for larger paper
		let p0 = { x: random(-350, -250), y: random(-200, 200) };
		// pn (end)
		let pn = { x: random(250, 350), y: random(-200, 200) };
		
		this.targetPoints.push(p0);
		this.playerPoints.push({ x: p0.x, y: p0.y });
		
		// Intermediates
		let n = this.numPoints - 1; // Degree
		for (let i = 1; i < n; i++) {
			this.targetPoints.push({
				x: random(-300, 300),
				y: random(-200, 200)
			});
			
			// Player intermediates start at a straight line between p0 and pn
			let t = i / n;
			this.playerPoints.push({
				x: lerp(p0.x, pn.x, t),
				y: lerp(p0.y, pn.y, t)
			});
		}
		
		this.targetPoints.push(pn);
		this.playerPoints.push({ x: pn.x, y: pn.y });
	}

	binomial(n, k) {
		if (k === 0 || k === n) return 1;
		if (n === 3 && (k === 1 || k === 2)) return 3;
		if (n === 4 && (k === 1 || k === 3)) return 4;
		if (n === 4 && k === 2) return 6;
		return 1;
	}

	evalBezier(points, t) {
		let n = points.length - 1;
		let x = 0;
		let y = 0;
		for (let i = 0; i <= n; i++) {
			let b = this.binomial(n, i) * Math.pow(1 - t, n - i) * Math.pow(t, i);
			x += b * points[i].x;
			y += b * points[i].y;
		}
		return { x: x, y: y };
	}

	drawBezier(points, curveColor, thickness) {
		push();
		noFill();
		stroke(curveColor);
		strokeWeight(thickness);
		beginShape();
		for (let t = 0; t <= 1.0; t += 0.02) {
			let pt = this.evalBezier(points, t);
			vertex(pt.x, pt.y);
		}
		endShape();
		pop();
	}

	spawnConfetti() {
		if (frameCount % 3 === 0) {
			this.particles.push({
				x: random(-width/2, width/2),
				y: height/2 + 50, // starts above the screen
				vx: random(-3, 3),
				vy: random(-5, -15),
				color: color(random(100, 255), random(100, 255), random(100, 255)),
				size: random(10, 25),
				rot: random(TWO_PI),
				rotSpeed: random(-0.2, 0.2)
			});
		}
	}

	drawConfetti() {
		for (let i = this.particles.length - 1; i >= 0; i--) {
			let p = this.particles[i];
			p.x += p.vx * dt;
			p.y += p.vy * dt;
			p.rot += p.rotSpeed * dt;
			
			push();
			translate(p.x, p.y, 10); // slight depth offset to be on top
			rotate(p.rot);
			fill(p.color);
			noStroke();
			rectMode(CENTER);
			rect(0, 0, p.size, p.size);
			pop();
			
			if (p.y < -height/2 - 50) {
				this.particles.splice(i, 1);
			}
		}
	}

	draw() {
		this.timer += dt;
		
		let audioFinished = false;
		let progress = 1.0;
		
		if (typeof audio_beziermatch !== 'undefined' && audio_beziermatch && audio_beziermatch.duration() > 0) {
			if (!audio_beziermatch.isPlaying() && this.timer > 30) {
				audioFinished = true;
				progress = 0;
			} else {
				let timeLeft = audio_beziermatch.duration() - audio_beziermatch.currentTime();
				progress = timeLeft / audio_beziermatch.duration();
			}
		} else {
			let maxTime = 480; 
			if (this.timer >= maxTime) {
				audioFinished = true;
				progress = 0;
			} else {
				progress = 1.0 - (this.timer / maxTime);
			}
		}
		
		// End game logic based on audio finish
		if (audioFinished && this.phase === 'PLAY') {
			this.phase = 'RESULT';
			if (this.won) {
				winMicrogame();
			} else {
				loseMicrogame();
			}
		}
		
		// Win check
		if (this.phase === 'PLAY' && !this.won) {
			let isMatch = true;
			
			// Calculate how much of the target curve is "uncovered" (gray part showing)
			let uncoveredPoints = 0;
			for (let u = 0.05; u < 0.95; u += 0.025) {
				let ptTarget = this.evalBezier(this.targetPoints, u);
				let minDist = Infinity;
				for (let t = 0.0; t <= 1.0; t += 0.025) {
					let ptPlayer = this.evalBezier(this.playerPoints, t);
					let d = dist(ptTarget.x, ptTarget.y, ptPlayer.x, ptPlayer.y);
					if (d < minDist) minDist = d;
				}
				if (minDist > 10) { 
					uncoveredPoints++;
				}
			}
			
			// Calculate how much of the player curve is "outside" the target
			let outsidePoints = 0;
			for (let t = 0.05; t < 0.95; t += 0.025) {
				let ptPlayer = this.evalBezier(this.playerPoints, t);
				let minDist = Infinity;
				for (let u = 0.0; u <= 1.0; u += 0.025) {
					let ptTarget = this.evalBezier(this.targetPoints, u);
					let d = dist(ptPlayer.x, ptPlayer.y, ptTarget.x, ptTarget.y);
					if (d < minDist) minDist = d;
				}
				if (minDist > 15) { 
					outsidePoints++;
				}
			}
			
			// Total points sampled is around 36. We allow up to 4 points to be visually "off"
			if (uncoveredPoints > 4 || outsidePoints > 4) {
				isMatch = false;
			}
			
			if (isMatch && this.hasMoved) {
				this.won = true;
				this.draggingIndex = -1; // Force drop
				if (typeof playWinVoiceline === 'function') playWinVoiceline();
			}
		}
		
		if (this.won) {
			this.spawnConfetti();
		}
		
		// Update Hover (Fix inverted mouse)
		let webglX = mouseX - width / 2;
		let webglY = height / 2 - mouseY;
		
		this.hoverIndex = -1;
		if (this.draggingIndex === -1 && this.phase === 'PLAY' && !this.won) {
			for (let i = 1; i < this.playerPoints.length - 1; i++) {
				if (dist(webglX, webglY, this.playerPoints[i].x, this.playerPoints[i].y) < 20) {
					this.hoverIndex = i;
					break;
				}
			}
		}

		// Desenho da Cena
		// Special victory background effect
		if (this.won) {
			let pulse = map(sin(this.timer * 0.2), -1, 1, 0, 50);
			background(160 + pulse, 100 + pulse/2, 60); 
		} else {
			background(160, 100, 60); 
		}
		
		push();
		resetMatrix();
		ortho(-width / 2, width / 2, height / 2, -height / 2, 0, 1000);
		noLights();
		
		// Papel
		if (this.won) {
			let glow = map(sin(this.timer * 0.3), -1, 1, 240, 255);
			fill(glow, glow, glow * 0.9);
		} else {
			fill(245, 245, 240);
		}
		noStroke();
		rectMode(CENTER);
		rect(0, 0, 800, 500, 10);
		
		// Desenha Curva Meta (Cinza fraco)
		this.drawBezier(this.targetPoints, color(180, 180, 180, 150), 6);
		
		// Removed target handles to hide their location as requested
		
		// Desenha Curva do Jogador
		if (this.won) {
			// Celebrate: Curve changes color
			let hue = (this.timer * 5) % 360;
			colorMode(HSB);
			this.drawBezier(this.playerPoints, color(hue, 80, 100), 6);
			colorMode(RGB);
		} else {
			this.drawBezier(this.playerPoints, color(0, 50, 200), 4);
		}
		
		// Linhas Guia e Handles do Jogador
		if (!this.won) {
			stroke(100, 150, 255, 150);
			strokeWeight(2);
			for (let i = 0; i < this.playerPoints.length - 1; i++) {
				line(this.playerPoints[i].x, this.playerPoints[i].y, this.playerPoints[i+1].x, this.playerPoints[i+1].y);
			}
			
			for (let i = 1; i < this.playerPoints.length - 1; i++) {
				if (i === this.draggingIndex) {
					fill(255, 50, 50);
					stroke(0);
					strokeWeight(2);
					ellipse(this.playerPoints[i].x, this.playerPoints[i].y, 20, 20);
				} else if (i === this.hoverIndex) {
					fill(255, 100, 100);
					stroke(0);
					strokeWeight(2);
					ellipse(this.playerPoints[i].x, this.playerPoints[i].y, 18, 18);
				} else {
					fill(200, 30, 30);
					stroke(0);
					strokeWeight(2);
					ellipse(this.playerPoints[i].x, this.playerPoints[i].y, 15, 15);
				}
			}
		}
		
		// Desenho da palavra de comando (ex: "MOLDE!")
		if (this.commandTimer > 0) {
			push();
			let alpha = map(this.commandTimer, 0, 15, 0, 255);
			alpha = constrain(alpha, 0, 255);
			tint(255, alpha);
			
			imageMode(CENTER);
			
			// Efeito de pulo (Pop) nos primeiros frames
			let scalePop = map(this.commandTimer, 60, 50, 2.0, 1.0);
			scalePop = constrain(scalePop, 1.0, 2.0);
			scale(scalePop, -scalePop); // O -scalePop desinverte o eixo Y do WebGL pra imagem não ficar de ponta-cabeça
			
			image(this.gfxText, 0, 0);
			pop();
			
			if (this.phase === 'PLAY') {
				this.commandTimer--;
			}
		}

		// Barra de tempo
		progress = constrain(progress, 0, 1);
		let barW = map(progress, 0, 1, 0, 800);
		noStroke();
		if (this.won) {
			fill(0, 255, 100); // Green bar if won
		} else {
			fill(255, 50, 0);
		}
		rectMode(CORNER);
		rect(-400, -280, barW, 20, 10);
		rectMode(CENTER);
		
		if (this.won) {
			this.drawConfetti();
		}
		
		pop();
		
		// Efeito visual de fechar a íris no final da música
		if (typeof audio_beziermatch !== 'undefined' && audio_beziermatch && audio_beziermatch.isPlaying()) {
			let timeLeft = audio_beziermatch.duration() - audio_beziermatch.currentTime();
			if (timeLeft > 0 && timeLeft < 0.35) {
				let p = timeLeft / 0.35;
				p = Math.pow(p, 3);
				if (typeof drawIris === 'function') {
					drawIris(p * 3, 0, height * 0.1, true);
				}
			}
		}
	}
	
	mousePressed() {
		if (this.phase !== 'PLAY' || this.won) return;
		if (this.hoverIndex !== -1) {
			this.draggingIndex = this.hoverIndex;
		}
	}
	
	mouseDragged() {
		if (this.phase !== 'PLAY' || this.won) return;
		if (this.draggingIndex !== -1) {
			this.hasMoved = true;
			
			let webglX = mouseX - width / 2;
			let webglY = height / 2 - mouseY;
			
			// Limitar arraste para dentro do papel
			webglX = constrain(webglX, -400, 400);
			webglY = constrain(webglY, -250, 250);
			
			this.playerPoints[this.draggingIndex].x = webglX;
			this.playerPoints[this.draggingIndex].y = webglY;
		}
	}
	
	mouseReleased() {
		this.draggingIndex = -1;
	}
}
