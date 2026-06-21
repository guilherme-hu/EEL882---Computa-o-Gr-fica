class LaserMirror {
	constructor() {
		this.phase = 'PLAY';
		this.timer = 0;
		this.result = null;
		this.confetti = [];
		this.selectedMirror = null;
		this.gfxInstruction = this.createInstructionGraphic();
		
		this.generateValidLevel();
		
		if (typeof music_lasermirror !== 'undefined') {
			music_lasermirror.play();
		}
	}
	
	generateValidLevel() {
		let valid = false;
		let attempts = 0;
		
		while (!valid && attempts < 1000) {
			attempts++;
			this.mirrors = [];
			this.walls = [];
			
			// Alvo
			let p_target = createVector(random(150, width/2 - 150), random(-height/2 + 150, height/2 - 150));
			if (random() > 0.5) p_target.x *= -1; 
			this.target = { x: p_target.x, y: p_target.y, r: 50 };
			
			// Função auxiliar
			let randomPoint = (fromPoint, minDist, maxDist) => {
				for (let i = 0; i < 100; i++) {
					let a = random(TWO_PI);
					let d = random(minDist, maxDist);
					let pt = createVector(fromPoint.x + cos(a)*d, fromPoint.y + sin(a)*d);
					if (pt.x > -width/2 + 100 && pt.x < width/2 - 100 && pt.y > -height/2 + 100 && pt.y < height/2 - 100) {
						return pt;
					}
				}
				return createVector(0,0);
			};
			
			let p_m2 = randomPoint(p_target, 200, 400);
			let p_m1 = randomPoint(p_m2, 200, 400);
			let p_emitter = randomPoint(p_m1, 250, 500);
			
			let vE_M1 = p5.Vector.sub(p_m1, p_emitter);
			this.emitter = { x: p_emitter.x, y: p_emitter.y, angle: vE_M1.heading() };
			
			this.mirrors.push({ x: p_m1.x, y: p_m1.y, angle: random(TWO_PI), length: 180 });
			this.mirrors.push({ x: p_m2.x, y: p_m2.y, angle: random(TWO_PI), length: 180 });
			
			if (random() > 0.5) {
				let p_fake = randomPoint(p_emitter, 150, 300);
				this.mirrors.push({
					x: p_fake.x, y: p_fake.y, 
					angle: random(TWO_PI), length: 180 
				});
			}
			
			// Centraliza o cenário no meio da tela ANTES de criar as paredes
			let cxSum = this.target.x + this.emitter.x;
			let cySum = this.target.y + this.emitter.y;
			let count = 2;
			for (let m of this.mirrors) {
				cxSum += m.x; cySum += m.y; count++;
			}
			let cX = cxSum / count; let cY = cySum / count;
			
			this.target.x -= cX; this.target.y -= cY;
			this.emitter.x -= cX; this.emitter.y -= cY;
			for (let m of this.mirrors) {
				m.x -= cX; m.y -= cY;
			}
			
			// Gera paredes
			let addBlockWall = (pt1, pt2) => {
				let v1 = createVector(pt1.x, pt1.y);
				let v2 = createVector(pt2.x, pt2.y);
				let center = p5.Vector.lerp(v1, v2, 0.5);
				center.x += random(-15, 15);
				center.y += random(-15, 15);
				let angle = p5.Vector.sub(v2, v1).heading() + HALF_PI;
				this.walls.push({ x: center.x, y: center.y, angle: angle, length: 100 }); // Parede menor (100)
			};
			
			addBlockWall(this.emitter, this.target);
			addBlockWall(this.emitter, this.mirrors[1]);
			addBlockWall(this.mirrors[0], this.target);
			
			// VALIDAÇÃO: as paredes geradas bloqueiam o caminho válido?
			let pE = createVector(this.emitter.x, this.emitter.y);
			let pM1 = createVector(this.mirrors[0].x, this.mirrors[0].y);
			let pM2 = createVector(this.mirrors[1].x, this.mirrors[1].y);
			let pT = createVector(this.target.x, this.target.y);
			
			let hitsWall = false;
			for (let w of this.walls) {
				let wP1 = createVector(w.x - cos(w.angle)*w.length/2, w.y - sin(w.angle)*w.length/2);
				let wP2 = createVector(w.x + cos(w.angle)*w.length/2, w.y + sin(w.angle)*w.length/2);
				
				if (this.lineIntersection(pE, pM1, wP1, wP2)) hitsWall = true;
				if (this.lineIntersection(pM1, pM2, wP1, wP2)) hitsWall = true;
				if (this.lineIntersection(pM2, pT, wP1, wP2)) hitsWall = true;
			}
			
			if (!hitsWall) {
				valid = true;
			}
		}
	}
	
	createInstructionGraphic() {
		let gfx = createGraphics(800, 200);
		gfx.clear();
		gfx.fill(255, 255, 0);
		gfx.textAlign(CENTER, CENTER);
		gfx.textFont("'Orbitron', Courier New");
		gfx.textSize(80);
		gfx.textStyle(BOLD);
		gfx.fill(0);
		gfx.text("Acerte!", 404, 104);
		gfx.fill(0, 255, 255); // Ciano
		gfx.text("Acerte!", 400, 100);
		return gfx;
	}
	
	// Intersecção de Linha (Raio) com Segmento (Espelho)
	lineIntersection(O, O_plus_D, p3, p4) {
		let p1 = O;
		let p2 = O_plus_D;
		let den = (p1.x - p2.x) * (p3.y - p4.y) - (p1.y - p2.y) * (p3.x - p4.x);
		if (abs(den) < 0.0001) return null; // Paralelos
		
		let t = ((p1.x - p3.x) * (p3.y - p4.y) - (p1.y - p3.y) * (p3.x - p4.x)) / den;
		let u = -((p1.x - p2.x) * (p1.y - p3.y) - (p1.y - p2.y) * (p1.x - p3.x)) / den;
		
		// t > 0 significa ir para frente no raio. u entre 0 e 1 é dentro do espelho
		if (t > 0 && u >= 0 && u <= 1) {
			let pt = createVector(p1.x + t * (p2.x - p1.x), p1.y + t * (p2.y - p1.y));
			return { pt: pt, t: t };
		}
		return null;
	}
	
	// Intersecção de Linha (Raio) com Círculo (Alvo)
	rayCircleIntersect(O, D, C, R) {
		let V = p5.Vector.sub(O, C);
		let b = 2 * V.dot(D);
		let c = V.dot(V) - R * R;
		let delta = b * b - 4 * c;
		if (delta >= 0) {
			let t1 = (-b - sqrt(delta)) / 2;
			let t2 = (-b + sqrt(delta)) / 2;
			let t = -1;
			if (t1 > 0) t = t1;
			else if (t2 > 0) t = t2;
			
			if (t > 0) {
				return { pt: p5.Vector.add(O, p5.Vector.mult(D, t)), t: t };
			}
		}
		return null;
	}
	
	raycast(O, D) {
		let closestHit = null;
		let minT = Infinity;
		
		// Testa todos os espelhos
		for (let m of this.mirrors) {
			// Pontas do espelho
			let mP1 = createVector(m.x - cos(m.angle)*m.length/2, m.y - sin(m.angle)*m.length/2);
			let mP2 = createVector(m.x + cos(m.angle)*m.length/2, m.y + sin(m.angle)*m.length/2);
			
			let p2 = p5.Vector.add(O, D); 
			
			let hit = this.lineIntersection(O, p2, mP1, mP2);
			// t > 0.01 evita que o raio colida com o espelho em que acabou de bater
			if (hit && hit.t > 0.01 && hit.t < minT) {
				minT = hit.t;
				
				// Normal da superfície
				let mDir = p5.Vector.sub(mP2, mP1).normalize();
				let normal = createVector(-mDir.y, mDir.x);
				// Garante que a normal aponte contra o raio (para reflexão funcionar sempre)
				if (normal.dot(D) > 0) {
					normal.mult(-1);
				}
				
				// Fórmula da reflexão vetorial: R = V - 2(V·N)N
				let dot = D.dot(normal);
				let reflectDir = p5.Vector.sub(D, p5.Vector.mult(normal, 2 * dot)).normalize();
				
				closestHit = { type: 'mirror', pt: hit.pt, t: hit.t, reflectDir: reflectDir, mirror: m };
			}
		}
		
		// Testa Paredes (Absorvem o laser)
		for (let w of this.walls) {
			let wP1 = createVector(w.x - cos(w.angle)*w.length/2, w.y - sin(w.angle)*w.length/2);
			let wP2 = createVector(w.x + cos(w.angle)*w.length/2, w.y + sin(w.angle)*w.length/2);
			let p2 = p5.Vector.add(O, D);
			let hit = this.lineIntersection(O, p2, wP1, wP2);
			if (hit && hit.t > 0.01 && hit.t < minT) {
				minT = hit.t;
				closestHit = { type: 'wall', pt: hit.pt, t: hit.t };
			}
		}
		
		// Testa o Alvo
		let targetC = createVector(this.target.x, this.target.y);
		let tHit = this.rayCircleIntersect(O, D, targetC, this.target.r);
		if (tHit && tHit.t > 0.01 && tHit.t < minT) {
			minT = tHit.t;
			closestHit = { type: 'target', pt: tHit.pt, t: tHit.t };
		}
		
		return closestHit;
	}
	
	// Para fazer o raio ir até a borda da tela se não bater em nada
	getBoundaryHit(O, D) {
		let tX = D.x > 0 ? (width/2 - O.x) / D.x : (-width/2 - O.x) / D.x;
		let tY = D.y > 0 ? (height/2 - O.y) / D.y : (-height/2 - O.y) / D.y;
		let txValid = tX > 0 ? tX : Infinity;
		let tyValid = tY > 0 ? tY : Infinity;
		let t = min(txValid, tyValid);
		return p5.Vector.add(O, p5.Vector.mult(D, t));
	}
	
	mousePressed() {
		if (this.phase !== 'PLAY') return;
		
		let cx = width / 2;
		let cy = height / 2;
		let mx = mouseX - cx;
		let my = mouseY - cy;
		
		// Procura se clicou perto de algum espelho para rotacionar
		let closestDist = Infinity;
		let closestM = null;
		for (let m of this.mirrors) {
			let d = dist(mx, my, m.x, m.y);
			if (d < closestDist) {
				closestDist = d;
				closestM = m;
			}
		}
		
		if (closestDist < 200) { // Hitbox bem maior (200px)
			this.selectedMirror = closestM;
			this.lastMouseAngle = atan2(my - closestM.y, mx - closestM.x);
		}
	}
	
	mouseDragged() {
		if (this.phase === 'PLAY' && this.selectedMirror) {
			let cx = width / 2;
			let cy = height / 2;
			let mx = mouseX - cx;
			let my = mouseY - cy;
			
			let currentMouseAngle = atan2(my - this.selectedMirror.y, mx - this.selectedMirror.x);
			let deltaAngle = currentMouseAngle - this.lastMouseAngle;
			
			// Lida com a quebra angular do atan2 de -PI para PI
			if (deltaAngle > PI) deltaAngle -= TWO_PI;
			if (deltaAngle < -PI) deltaAngle += TWO_PI;
			
			// Rotaciona o espelho proporcionalmente com uma taxa de 0.5 para maior precisão!
			this.selectedMirror.angle += deltaAngle * 0.5;
			this.lastMouseAngle = currentMouseAngle;
		}
	}
	
	mouseReleased() {
		this.selectedMirror = null;
	}
	
	draw() {
		this.timer += dt;
		
		// Fundo plano 2D futurista escuro
		background(10, 15, 30); 
		
		push();
		resetMatrix();
		ortho(); // Conserta o eixo Y voltando para o padrão do p5
		noLights(); // O jogo é perfeitamente 2D!
		
		// Desenha o Alvo (Dartboard com círculos vermelhos e brancos)
		push();
		translate(this.target.x, this.target.y, 0);
		noStroke();
		for (let i = 5; i > 0; i--) {
			fill(i % 2 === 0 ? color(255) : color(255, 30, 30));
			ellipse(0, 0, this.target.r * 2 * (i/5), this.target.r * 2 * (i/5));
		}
		// Argola dourada em volta
		noFill(); stroke(255, 200, 0); strokeWeight(4);
		ellipse(0, 0, this.target.r * 2, this.target.r * 2);
		pop();
		
		// Desenha Paredes Não Refletivas
		for (let w of this.walls) {
			push();
			translate(w.x, w.y, 0.5);
			rotateZ(w.angle);
			rectMode(CENTER);
			fill(40, 45, 55); // Cor sólida chumbo
			stroke(20);
			strokeWeight(2);
			rect(0, 0, w.length, 25, 2); 
			
			// Detalhe industrial na parede
			noStroke(); fill(20);
			rect(0, 0, w.length - 10, 5);
			pop();
		}
		
		// Desenha os Espelhos
		for (let m of this.mirrors) {
			push();
			translate(m.x, m.y, 1);
			rotateZ(m.angle);
			rectMode(CENTER);
			
			if (this.selectedMirror === m) {
				stroke(0, 255, 255);
				strokeWeight(6);
			} else {
				stroke(100, 150, 200);
				strokeWeight(4);
			}
			fill(200, 255, 255);
			rect(0, 0, m.length, 12, 10);
			// Parafusos do espelho
			fill(50); noStroke();
			ellipse(-m.length/2 + 10, 0, 8, 8);
			ellipse(m.length/2 - 10, 0, 8, 8);
			
			// Setinhas de rotação se for começo de jogo ou selecionado
			if (this.timer < 120 || this.selectedMirror === m) {
				noFill();
				stroke(255, 255, 0, 150);
				strokeWeight(3);
				arc(0, 0, m.length + 30, m.length + 30, PI/4, 3*PI/4);
				arc(0, 0, m.length + 30, m.length + 30, 5*PI/4, 7*PI/4);
				// Ponta da seta
				push();
				fill(255, 255, 0, 150); noStroke();
				let ax = cos(3*PI/4) * (m.length/2 + 15);
				let ay = sin(3*PI/4) * (m.length/2 + 15);
				translate(ax, ay);
				rotate(3*PI/4 + HALF_PI);
				triangle(-10, 10, 10, 10, 0, -10);
				pop();
			}
			pop();
		}
		
		// Desenha o Canhão Emissor
		push();
		translate(this.emitter.x, this.emitter.y, 2);
		rotateZ(this.emitter.angle);
		fill(50);
		stroke(100);
		strokeWeight(2);
		rectMode(CENTER);
		rect(-20, 0, 50, 40, 5); // Base
		fill(255, 50, 50);
		noStroke();
		rect(15, 0, 20, 15); // Bico do canhão
		pop();
		
		// SIMULAÇÃO DO LASER (Motor de Raycast)
		let maxBounces = 15;
		let segments = [];
		let currentPt = createVector(this.emitter.x + cos(this.emitter.angle)*25, this.emitter.y + sin(this.emitter.angle)*25);
		let currentDir = p5.Vector.fromAngle(this.emitter.angle);
		let wonThisFrame = false;
		
		for (let i = 0; i < maxBounces; i++) {
			let hitResult = this.raycast(currentPt, currentDir);
			if (hitResult) {
				segments.push({ p1: currentPt, p2: hitResult.pt });
				if (hitResult.type === 'target') {
					if (this.phase === 'PLAY') wonThisFrame = true;
					break;
				} else if (hitResult.type === 'wall') {
					// Absorve e para
					break;
				} else if (hitResult.type === 'mirror') {
					currentPt = hitResult.pt;
					currentDir = hitResult.reflectDir;
				}
			} else {
				let boundaryPt = this.getBoundaryHit(currentPt, currentDir);
				segments.push({ p1: currentPt, p2: boundaryPt });
				break;
			}
		}
		
		// Renderiza os segmentos do laser com efeito Neon
		stroke(255, 0, 0, 100);
		strokeWeight(12);
		for (let seg of segments) line(seg.p1.x, seg.p1.y, seg.p2.x, seg.p2.y); // Glow
		
		stroke(255, 50, 50);
		strokeWeight(6);
		for (let seg of segments) line(seg.p1.x, seg.p1.y, seg.p2.x, seg.p2.y); // Core espesso
		
		stroke(255, 200, 200); 
		strokeWeight(2);
		for (let seg of segments) line(seg.p1.x, seg.p1.y, seg.p2.x, seg.p2.y); // Branco interno
		
		// Instrução de início
		if (this.timer < 90) {
			push();
			translate(0, -height/4, 1);
			noLights();
			noStroke();
			let alpha = constrain(map(this.timer, 30, 90, 255, 0), 0, 255);
			tint(255, alpha);
			texture(this.gfxInstruction);
			plane(800, 200);
			tint(255, 255);
			pop();
		}
		
		pop(); // Retorna das configs ortográficas da fase 2D
		
		// Barra de tempo sincronizada (Padrão dos Microgames)
		push();
		resetMatrix();
		let progress = 1.0;
		if (typeof music_lasermirror !== 'undefined' && music_lasermirror.duration() > 0) {
			progress = 1.0 - (music_lasermirror.currentTime() / music_lasermirror.duration());
		}
		progress = constrain(progress, 0, 1);
		let barW = map(progress, 0, 1, 0, 600);
		noStroke();
		fill(255, 50, 0);
		rectMode(CORNER);
		rect(-300, height/2 - 40, barW, 20, 10);
		pop();
		
		// Efeitos de Fim de Jogo
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
				// Efeito de erro balançando a tela como pedido
				translate(random(-15, 15), random(-15, 15), 0);
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
		
		// Executa gatilho de vitória
		if (wonThisFrame && this.phase === 'PLAY') {
			this.phase = 'REVEAL';
			this.result = 'WIN';
			playWinVoiceline();
			this.createConfetti();
		}
		
		// Lógica de Timeout / Passagem de cena
		if (this.phase === 'PLAY') {
			if (typeof music_lasermirror !== 'undefined' && !music_lasermirror.isPlaying() && this.timer > 30) {
				this.phase = 'REVEAL';
				this.result = 'LOSE';
				loseMicrogame();
			}
		} else if (this.phase === 'REVEAL') {
			if (typeof music_lasermirror !== 'undefined' && !music_lasermirror.isPlaying() && this.timer > 30) {
				if (this.result === 'WIN') winMicrogame();
			}
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
