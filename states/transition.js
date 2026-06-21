function drawTransitionPhase() {
	drawHubScene();
	
	let prevTimer = hubTimer;
	hubTimer += dt; // Incrementa o timer com base no delta time para suavizar a animação independentemente do FPS
	
	let w = width;
	let h = height;

	// Escala de progresso de 0 a 1 para diferentes fases
	let animScale = 0;
	if (hubTimer <= 65) {
		// Tempo até placa preencher a tela
		let tProgress = constrain((hubTimer - 45) / 20.0, 0, 1);
		animScale = 1 - Math.pow(1 - tProgress, 3); // ease-out rápido
	} else if (hubTimer <= 110) {
		// Tempo da placa na tela
		animScale = 1;
	} else if (hubTimer <= 130) {
		// Sai da tela rapidamente
		let tProgress = constrain((hubTimer - 110) / 20.0, 0, 1);
		animScale = 1 + tProgress * 0.5; // cresce mais ainda antes de sumir
		animScale = map(tProgress, 0, 1, 1, 0); 
	} else {
		animScale = 0;
	}

	if (prevTimer <= 135 && hubTimer > 135) {
		score++;
		if (phaseDiv) {
			phaseDiv.style('transform', 'scale(1.5)');
			setTimeout(() => {
				if (phaseDiv) phaseDiv.style('transform', 'scale(1)');
			}, 800 / globalSpeedMultiplier);
		}
	}

	push();
	resetMatrix();
	ortho(-width / 2, width / 2, height / 2, -height / 2, 0, 1000);

	// Placa de Instrução
	if (animScale > 0) {
		push();
		translate(0, height * 0.1, 500); 
		scale(animScale);
		
		// Fundo da placa 
		rectMode(CENTER);
		fill(255); 
		stroke(0);
		strokeWeight(10);
		rect(0, 0, 400, 300); 
		
		// Desenho do ícone do mouse
		push();
		translate(0, -40); // Move para o centro da placa
		scale(1, -1);      // Desinverte para desenhar direito
		strokeWeight(4);
		stroke(0);
		
		// Fio do mouse
		line(0, -60, 0, -100);
		
		// Corpo do mouse (Oval simples)
		fill(200);
		ellipse(0, 0, 80, 120);
		
		// Linhas separadoras dos botões e do fio
		line(0, -60, 0, -10);
		line(-38, -10, 38, -10);
		
		// Scroll
		fill(50);
		rectMode(CENTER);
		rect(0, -25, 8, 20); 
		pop();
		
		// Renderiza o texto gerado via p5.Graphics
		push();
		imageMode(CENTER);
		scale(1, -1);
		image(textGraphics, 0, -100); 
		pop();

		pop();
	}
	
	pop();

	// Fim da transição - Checa se a música acabou antes de entrar no microgame
	let timeLeft = 0;
	if (typeof music_normal !== 'undefined' && music_normal.isPlaying() && music_normal.buffer) {
		timeLeft = music_normal.duration() - music_normal.currentTime();
	}
	
	// Garante que o minigame só entra quando o áudio tá pronto e a íris fechou
	if (hubTimer > 60 && ((timeLeft > 0 && timeLeft <= 0.45) || (!music_normal || !music_normal.isPlaying()))) { 
		currentState = GameState.MICROGAME;
		
		if (music_normal) music_normal.stop();
		
		if (availableMicrogames.length === 0) {
			availableMicrogames = [...allMicrogames];
		}
		
		let randomIndex = floor(random(availableMicrogames.length));
		let nextGameName = availableMicrogames.splice(randomIndex, 1)[0];
		
		// Retoma a música caso o microgame use música paralela (opcional)
		if (nextGameName === 'SecretShape' && typeof music_secretshape !== 'undefined') {
			music_secretshape.play();
			if (music_normal) music_normal.pause();
		} else if (nextGameName === 'BezierMatch') {
			if (music_normal) music_normal.pause();
		} else if (nextGameName === 'WhackABump') {
			if (music_normal) music_normal.pause();
		} else if (nextGameName === 'ClockMatch' && typeof music_clockmatch !== 'undefined') {
			music_clockmatch.play();
			if (music_normal) music_normal.pause();
		} else if (nextGameName === 'LaserMirror' && typeof music_lasermirror !== 'undefined') {
			music_lasermirror.play();
			if (music_normal) music_normal.pause();
		}
		
		if (nextGameName === 'SecretShape') {
			currentMicrogame = new SecretShape();
		} else if (nextGameName === 'BezierMatch') {
			currentMicrogame = new BezierMatch();
		} else if (nextGameName === 'WhackABump') {
			currentMicrogame = new WhackABump();
		} else if (nextGameName === 'ClockMatch') {
			currentMicrogame = new ClockMatch();
		} else if (nextGameName === 'LaserMirror') {
			currentMicrogame = new LaserMirror();
		} else {
			// Dummy temporário para não dar crash se a classe ainda não existir
			currentMicrogame = { draw: () => { background(50); fill(255); textSize(32); text("Microgame Dummy (Implementar!)", 0, 0); }, mousePressed: () => {}, mouseDragged: () => {} }; 
		}
		hubTimer = 0;
	}
}

// Função para desenhar a tela de transição entre o Hub e o Microgame
function drawIris(progress, cx = 0, cy = 0, useShader = false) {
	push();
	resetMatrix();
	ortho(-width / 2, width / 2, height / 2, -height / 2, 0, 1000);
	
	if (useShader && typeof my_shader !== 'undefined' && !performanceMode) {
		shader(my_shader);
		my_shader.setUniform('iResolution', [width, height]);
		my_shader.setUniform('iTime', shaderTime);
	} else {
		noLights();
		fill(0); 
	}
	noStroke();
	
	let maxRadius = max(
		dist(cx, cy, -width/2, -height/2),
		dist(cx, cy, width/2, -height/2),
		dist(cx, cy, width/2, height/2),
		dist(cx, cy, -width/2, height/2)
	) + 50; 
	
	let currentRadius = maxRadius * progress;
	
	// Desenha a máscara da íris
	beginShape();
	// Borda externa
	vertex(-width/2, -height/2);
	vertex(width/2, -height/2);
	vertex(width/2, height/2);
	vertex(-width/2, height/2);
	
	// Borda interna (o furo)
	beginContour();
	for (let a = TWO_PI; a > 0; a -= 0.1) {
		vertex(cx + cos(a) * currentRadius, cy + sin(a) * currentRadius);
	}
	endContour();
	
	endShape(CLOSE);
	
	if (useShader) {
		resetShader();
	}
	
	pop();
}
