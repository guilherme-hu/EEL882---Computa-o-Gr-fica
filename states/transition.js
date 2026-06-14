function drawTransitionPhase() {
	drawHubScene();
		
	push();
	resetMatrix();
	ortho(-width / 2, width / 2, height / 2, -height / 2, 0, 1000);
	noLights();
	
	// Sequência de Animação da placa
	let animScale = 0;
	if (hubTimer <= 65) {
		// Aparecendo (frame 45 ao 65)
		let tProgress = constrain((hubTimer - 45) / 20.0, 0, 1);
		animScale = 1 - Math.pow(1 - tProgress, 3); // ease-out
	} else if (hubTimer <= 110) {
		// Fica fixa
		animScale = 1;
	} else if (hubTimer <= 130) {
		// Some diminuindo (frame 110 ao 130)
		let tProgress = constrain((hubTimer - 110) / 20.0, 0, 1);
		animScale = Math.pow(1 - tProgress, 3); // ease-in
	} else {
		animScale = 0;
	}

	// Momento exato em que a placa termina de sumir: incrementa pontuação e dá o salto
	if (hubTimer === 135) {
		score++;
		if (phaseDiv) {
			phaseDiv.style('transform', 'scale(1.5)');
			setTimeout(() => {
				if (phaseDiv) phaseDiv.style('transform', 'scale(1)');
			}, 800);
		}
	}

	translate(0, height * 0.1, 500); // Em cima de tudo, na posição da estrela

	// 2. Placa saindo do centro (Só desenha se estiver visível)
	if (animScale > 0) {
		push();
		scale(animScale);
		
		// Fundo da placa (Quadrado simples otimizado, sem bordas arredondadas)
		rectMode(CENTER);
		fill(255); 
		stroke(0);
		strokeWeight(10);
		rect(0, 0, 400, 300); 
		
		// Desenho manual do ícone do mouse (Geometria 2D nativa leve)
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
		
		// Roda (Scroll)
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

	hubTimer++;
	
	let timeLeft = 0;
	if (music_normal && music_normal.isPlaying()) {
		timeLeft = music_normal.duration() - music_normal.currentTime();
	}

	// Começa a transição de abertura (25 frames = ~0.42s) um pouco antes da música acabar!
	// Assim a tela já rasga revelando o jogo junto com o último beat do jingle.
	if (hubTimer > 60 && ((timeLeft > 0 && timeLeft <= 0.45) || (!music_normal || !music_normal.isPlaying()))) { 
		currentState = GameState.MICROGAME;
		if (typeof SecretShape !== 'undefined') {
			currentMicrogame = new SecretShape(); // Inicializa se existir
		} else {
			// Dummy temporário para não dar crash se a classe ainda não existir
			currentMicrogame = { draw: () => { background(50); fill(255); textSize(32); text("Microgame Dummy (Implementar!)", 0, 0); }, mousePressed: () => {}, mouseDragged: () => {} }; 
		}
		hubTimer = 0;
	}
}

function drawIris(progress, cx = 0, cy = 0, useShader = false) {
	push();
	resetMatrix();
	ortho(-width / 2, width / 2, height / 2, -height / 2, 0, 1000);
	
	if (useShader && typeof my_shader !== 'undefined') {
		shader(my_shader);
		my_shader.setUniform('iResolution', [width, height]);
		my_shader.setUniform('iTime', millis() / 1000.0);
	} else {
		noLights();
		fill(0); // Fundo preto padrão
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
