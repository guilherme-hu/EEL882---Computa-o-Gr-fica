class WhackABump {
	constructor() {
		this.timer = 0;
		this.phase = 'PLAY';
		this.won = false;
		this.surpriseSpawned = false; // Flag para o galo surpresa
		this.particles = [];
		this.clickTargets = [];
		
		this.nu = 7;
		this.nv = 7;
		this.ctrl = [];
		let extent = 800; // Aumentado para ocupar mais espaço
		let sp = extent / (this.nu - 1);
		
		// Criar grade no plano X, Y. Z será a altura do galo.
		for (let i = 0; i < this.nu; i++) {
			let row = [];
			for (let j = 0; j < this.nv; j++) {
				row.push({
					x: (j - (this.nv - 1) * 0.5) * sp,
					y: (i - (this.nu - 1) * 0.5) * sp,
					z: 0,
					targetZ: 0
				});
			}
			this.ctrl.push(row);
		}
		
		// Escolher 2 pontos internos aleatórios para elevar (os "galos")
		let elevated = 0;
		while(elevated < 2) {
			let i = floor(random(1, 6)); // Entre 1 e 5 (borda interna)
			let j = floor(random(1, 6));
			if (this.ctrl[i][j].targetZ === 0) {
				// Galos apontam para cima (com rotateX positivo, o eixo Z positivo sobe na tela)
				this.ctrl[i][j].targetZ = 200;
				this.ctrl[i][j].z = 200;
				elevated++;
			}
		}
		
		this.dirty = true;
		this.surf_pts = [];
		
		// Pre-renderizar o texto de instrução numa textura 2D para suportar fontes no WEBGL
		this.gfxText = createGraphics(800, 200);
		this.gfxText.clear();
		this.gfxText.fill(255); // Cor branca
		this.gfxText.textAlign(CENTER, CENTER);
		this.gfxText.textFont('Georgia');
		this.gfxText.textSize(120);
		this.gfxText.textStyle(NORMAL);
		this.gfxText.text("ESMAGUE!", 400, 100);
		
		if (typeof audio_bonk !== 'undefined' && audio_bonk) {
			audio_bonk.setVolume(1.0);
			audio_bonk.play();
		}
	}
	
	subdivideRow(pts) {
		let doubled = [];
		for (let i = 0; i < pts.length; i++) {
			doubled.push({x: pts[i].x, y: pts[i].y, z: pts[i].z});
			doubled.push({x: pts[i].x, y: pts[i].y, z: pts[i].z});
		}
		let smoothed = [];
		for (let i = 0; i < doubled.length - 1; i++) {
			smoothed.push({
				x: 0.5 * doubled[i].x + 0.5 * doubled[i+1].x,
				y: 0.5 * doubled[i].y + 0.5 * doubled[i+1].y,
				z: 0.5 * doubled[i].z + 0.5 * doubled[i+1].z
			});
		}
		return smoothed;
	}
	
	subdivideSurface(grid) {
		let rowsSub = [];
		for (let i = 0; i < grid.length; i++) {
			rowsSub.push(this.subdivideRow(grid[i]));
		}
		
		// Transpose
		let cols = rowsSub[0].length;
		let transposed = [];
		for (let j = 0; j < cols; j++) {
			let col = [];
			for (let i = 0; i < rowsSub.length; i++) {
				col.push(rowsSub[i][j]);
			}
			transposed.push(col);
		}
		
		// Subdivide columns
		let colsSub = [];
		for (let j = 0; j < transposed.length; j++) {
			colsSub.push(this.subdivideRow(transposed[j]));
		}
		
		// Transpose back
		let finalGrid = [];
		let finalRows = colsSub[0].length;
		for (let i = 0; i < finalRows; i++) {
			let row = [];
			for (let j = 0; j < colsSub.length; j++) {
				row.push(colsSub[j][i]);
			}
			finalGrid.push(row);
		}
		return finalGrid;
	}
	
	spawnConfetti() {
		for (let i = 0; i < 50; i++) {
			this.particles.push({
				x: random(-width/2, width/2),
				y: random(-height/2 - 200, -height/2 - 50),
				vx: random(-5, 5),
				vy: random(5, 15),
				color: color(random(100, 255), random(100, 255), random(100, 255)),
				size: random(10, 20),
				rot: random(TWO_PI),
				rotSpeed: random(-0.2, 0.2)
			});
		}
	}
	
	drawConfetti() {
		push();
		resetMatrix(); // Garante que será desenhado como 2D na tela
		for (let p of this.particles) {
			p.x += p.vx;
			p.y += p.vy;
			p.rot += p.rotSpeed;
			
			push();
			translate(p.x, p.y);
			rotate(p.rot);
			noStroke();
			fill(p.color);
			rectMode(CENTER);
			rect(0, 0, p.size, p.size);
			pop();
		}
		pop();
	}
	
	draw() {
		background(22, 28, 40); // Fundo escuro
		
		let dt = deltaTime / 16.666;
		this.timer += dt;
		
		let audioFinished = false;
		let progress = 1.0;
		
		// Tratamento robusto para a música e a barra de progresso
		let dur = 0;
		if (typeof audio_bonk !== 'undefined' && audio_bonk && typeof audio_bonk.duration === 'function') {
			let d = audio_bonk.duration();
			if (!isNaN(d) && d > 0) dur = d;
		}
		
		if (dur > 0) {
			if (!audio_bonk.isPlaying() && this.timer > 30) {
				audioFinished = true;
				progress = 0;
			} else {
				let cur = audio_bonk.currentTime() || 0;
				progress = (dur - cur) / dur;
			}
		} else {
			// Fallback caso falhe
			let maxTime = 300; 
			if (this.timer >= maxTime) {
				audioFinished = true;
				progress = 0;
			} else {
				progress = 1.0 - (this.timer / maxTime);
			}
		}
		
		if (isNaN(progress)) progress = 1.0;
		
		if (audioFinished && this.phase === 'PLAY') {
			this.phase = 'RESULT';
			if (this.won) winMicrogame();
			else loseMicrogame();
		}
		
		// Spawn do 3º galo (Galo surpresa) em 2 segundos
		if (this.timer > 120 && !this.surpriseSpawned && this.phase === 'PLAY') {
			this.surpriseSpawned = true;
			let spawned = false;
			let attempts = 0;
			while(!spawned && attempts < 20) {
				let i = floor(random(1, 6));
				let j = floor(random(1, 6));
				if (this.ctrl[i][j].targetZ === 0 && this.ctrl[i][j].z < 5) {
					this.ctrl[i][j].targetZ = 200; // Define que ele quer ser um galo
					// Não alteramos o z atual, assim a lógica de animação fará ele crescer!
					spawned = true;
				}
				attempts++;
			}
		}
		
		// Animação descendo ou subindo
		let maxElevation = 0;
		for (let i = 0; i < this.nu; i++) {
			for (let j = 0; j < this.nv; j++) {
				if (this.ctrl[i][j].z > this.ctrl[i][j].targetZ) { 
					this.ctrl[i][j].z -= 60 * dt; // Descendo em direção ao zero
					if (this.ctrl[i][j].z < this.ctrl[i][j].targetZ) {
						this.ctrl[i][j].z = this.ctrl[i][j].targetZ;
					}
					this.dirty = true;
				} else if (this.ctrl[i][j].z < this.ctrl[i][j].targetZ) {
					this.ctrl[i][j].z += 80 * dt; // Subindo! (Efeito de brotar rapidamente)
					if (this.ctrl[i][j].z > this.ctrl[i][j].targetZ) {
						this.ctrl[i][j].z = this.ctrl[i][j].targetZ;
					}
					this.dirty = true;
				}
				
				if (this.ctrl[i][j].z > 5) {
					maxElevation = 1;
				}
			}
		}
		
		if (maxElevation === 0 && !this.won && this.phase === 'PLAY' && this.surpriseSpawned) {
			this.won = true;
			this.spawnConfetti();
			if (typeof playWinVoiceline === 'function') playWinVoiceline();
		}
		
		if (this.dirty) {
			let sub = this.ctrl;
			for (let r = 0; r < 3; r++) { // 3 subdivisões
				sub = this.subdivideSurface(sub);
			}
			this.surf_pts = sub;
			this.dirty = false;
		}
		
		this.clickTargets = [];
		
		push();
		let tx = 0;
		let ty = 100;
		let tz = -300;
		let angX = PI / 3; // Rotação para o plano virar um "chão" (visão de cima para baixo)
		let angZ = PI / 4;  // Rotação em losango
		
		translate(tx, ty, tz);
		rotateX(angX);
		rotateZ(angZ);
		
		// Desenhar a superfície (wireframe)
		noFill();
		stroke(70, 110, 170); // Cor azul da malha
		strokeWeight(1.5);
		for (let i = 0; i < this.surf_pts.length - 1; i++) {
			for (let j = 0; j < this.surf_pts[0].length - 1; j++) {
				beginShape(QUADS);
				vertex(this.surf_pts[i][j].x, this.surf_pts[i][j].y, this.surf_pts[i][j].z);
				vertex(this.surf_pts[i][j+1].x, this.surf_pts[i][j+1].y, this.surf_pts[i][j+1].z);
				vertex(this.surf_pts[i+1][j+1].x, this.surf_pts[i+1][j+1].y, this.surf_pts[i+1][j+1].z);
				vertex(this.surf_pts[i+1][j].x, this.surf_pts[i+1][j].y, this.surf_pts[i+1][j].z);
				endShape(CLOSE);
			}
		}
		
		// Desenhar a grade de controle
		stroke(255, 200, 50, 160); // Amarelo translúcido
		strokeWeight(1.5);
		noFill();
		for (let i = 0; i < this.nu; i++) {
			beginShape();
			for (let j = 0; j < this.nv; j++) {
				vertex(this.ctrl[i][j].x, this.ctrl[i][j].y, this.ctrl[i][j].z);
			}
			endShape();
		}
		for (let j = 0; j < this.nv; j++) {
			beginShape();
			for (let i = 0; i < this.nu; i++) {
				vertex(this.ctrl[i][j].x, this.ctrl[i][j].y, this.ctrl[i][j].z);
			}
			endShape();
		}
		
		// Desenhar esferas e salvar posições customizadas de colisão
		noStroke();
		
		let camZ = (height / 2) / Math.tan(PI / 6); // Configuração padrão da perspectiva do p5
		
		for (let i = 0; i < this.nu; i++) {
			for (let j = 0; j < this.nv; j++) {
				let pt = this.ctrl[i][j];
				
				push();
				translate(pt.x, pt.y, pt.z);
				if (pt.targetZ > 10) { 
					// É um galo
					fill(255, 75, 75);
					sphere(25);
					
					// Calcular a projeção manualmente para evitar crashes com o screenX nativo
					// 1. Rotação Z
					let x1 = pt.x * Math.cos(angZ) - pt.y * Math.sin(angZ);
					let y1 = pt.x * Math.sin(angZ) + pt.y * Math.cos(angZ);
					let z1 = pt.z;
					// 2. Rotação X
					let x2 = x1;
					let y2 = y1 * Math.cos(angX) - z1 * Math.sin(angX);
					let z2 = y1 * Math.sin(angX) + z1 * Math.cos(angX);
					// 3. Tradução
					let x3 = x2 + tx;
					let y3 = y2 + ty;
					let z3 = z2 + tz;
					// 4. Projeção de Perspectiva
					let factor = camZ / (camZ - z3);
					let sx = x3 * factor;
					let sy = y3 * factor;
					
					this.clickTargets.push({i: i, j: j, x: sx, y: sy});
				} else {
					// Ponto normal
					fill(255, 210, 60);
					sphere(10);
				}
				pop();
			}
		}
		pop(); // Fim do mundo 3D
		
		// Barra de tempo na frente
		push();
		resetMatrix(); // Limpa as transformações rotacionais
		translate(0, 0, 0); // Mantém no plano Z=0 do canvas 2D sobreposto
		progress = constrain(progress, 0, 1);
		let barW = map(progress, 0, 1, 0, 600);
		noStroke();
		fill(255, 50, 0);
		rectMode(CORNER);
		rect(-300, height/2 - 40, barW, 20, 10);
		
		// Texto instrucional inicial
		if (this.timer < 60) {
			push();
			let alpha = map(this.timer, 0, 60, 255, 0);
			tint(255, alpha);
			imageMode(CENTER);
			// Renderiza a textura desenhada 2D no canvas 3D
			image(this.gfxText, 0, -150);
			pop();
		}
		pop();
		
		// Desenha as partículas independentemente do estado do jogo (para capturar os acertos vermelhos)
		this.drawConfetti();
	}
	
	mousePressed() {
		if (this.phase !== 'PLAY' || this.won) return;
		
		let best = null;
		let bestD = 60; // Margem de erro do clique
		for (let target of this.clickTargets) {
			// Em WebGL, mouseX e mouseY variam do canto superior esquerdo até bottom right
			// O canvas WebGL centraliza no 0,0, então a projeção manual que fizemos mapeou com 0,0 no centro.
			// mouseX - width/2 é o mapeamento correto.
			let mx = mouseX - width / 2;
			let my = mouseY - height / 2;
			
			let d = dist(mx, my, target.x, target.y);
			if (d < bestD) {
				bestD = d;
				best = target;
			}
		}
		
		if (best) {
			// Reduz a zero para afundar o galo
			this.ctrl[best.i][best.j].targetZ = 0;
			
			// Partículas
			for (let k = 0; k < 15; k++) {
				this.particles.push({
					x: best.x, 
					y: best.y,
					vx: random(-10, 10),
					vy: random(-10, 10),
					color: color(255, 75, 75),
					size: random(8, 15),
					rot: 0,
					rotSpeed: 0.1
				});
			}
		}
	}
	
	mouseDragged() {}
	mouseReleased() {}
}
