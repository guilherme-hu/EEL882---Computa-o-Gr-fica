function preload() {
	// Shader do fundo
	my_shader = loadShader("shaders/shader.vert", "shaders/shader.frag");

	// Load de imagens
	mouseImg = loadImage("images/mouse.png");

	// Load de sons
	// Aúdios do jogo WarioWare Smooth Moves
	// https://www.youtube.com/watch?v=j5hNgRom-3M
	// https://www.youtube.com/watch?v=-UewSOg2Qbs&list=PL7443260FEE96175F&index=47
	music_normal = loadSound("audios/orbulon.mp3");
	music_vitoria = loadSound("audios/orbulon_vit.mp3");
	music_derrota = loadSound("audios/orbulon_der.mp3");
	music_secretshape = loadSound("audios/secret_shape.mp3");
	music_gameover = loadSound("audios/gameover.mp3");
	music_insta_gameover = loadSound("audios/insta_gameover.mp3");
	music_menu = loadSound("audios/menu.mp3");
}

function setup() {
	createCanvas(windowWidth, windowHeight, WEBGL);
	pixelDensity(1);
	noStroke();

	// Gráfico para instruções da fase
	textGraphics = createGraphics(400, 100);
	textGraphics.textAlign(CENTER, CENTER);
	textGraphics.textSize(48);
	textGraphics.textFont("'Orbitron', sans-serif");
	textGraphics.fill(0);
	textGraphics.noStroke();
	textGraphics.text("Mouse", 200, 50);

	// Gráfico para a palavra GAME OVER (Pré-gameover)
	gameOverGraphics = createGraphics(800, 200);
	gameOverGraphics.textAlign(CENTER, CENTER);
	gameOverGraphics.textSize(120);
	gameOverGraphics.textFont("'Impact', sans-serif"); 
	gameOverGraphics.fill(255, 0, 0); // Vermelho puro
	gameOverGraphics.stroke(0); 
	gameOverGraphics.strokeWeight(8);
	gameOverGraphics.text("GAME OVER", 400, 100);

	// HTML para o Número da Fase
	phaseDiv = createDiv('');
	phaseDiv.id('phaseDiv');
	phaseDiv.style('position', 'absolute');
	phaseDiv.style('width', '100%');
	phaseDiv.style('text-align', 'center');
	phaseDiv.style('top', '30px');
	phaseDiv.style('font-size', '80px');
	phaseDiv.style('font-family', "'Orbitron', sans-serif");
	phaseDiv.style('font-weight', '900');
	phaseDiv.style('color', '#ffc800');
	phaseDiv.style('text-shadow', '4px 4px 0px #000, -2px -2px 0px #000, 2px -2px 0px #000, -2px 2px 0px #000');
	phaseDiv.style('pointer-events', 'none');
	phaseDiv.style('display', 'none');
	phaseDiv.style('transition', 'transform 0.25s ease-out'); 

	setupStartUI();
	setupGameOverUI();
	
	// Compila o modelo estático da nave para a VBO (GPU) apenas uma vez
	if (typeof buildArwingModel === 'function') {
		arwingModel = buildArwingModel();
	}
}

function windowResized() {
	resizeCanvas(windowWidth, windowHeight);
	if (startButton) {
		startButton.position(width / 2 - 100, height - 100);
	}
	if (gameOverContainer) {
		gameOverContainer.size(windowWidth, windowHeight);
	}
}

// Atalhos do jogo para teste e debug
function keyPressed() {
	if (currentState === GameState.START) return; 

	// L para perder vida (ou resetar vidas se já estiver em 0)
	if (key === 'l' || key === 'L') {
		if (vidas > 0) {
			performExplosion();
		} else {
			vidas = 4; 
		}
	}
}

function mouseDragged() {
	if (currentState === GameState.MICROGAME && currentMicrogame) {
		if (typeof currentMicrogame.mouseDragged === 'function') {
			currentMicrogame.mouseDragged();
		}
	}
}

function mousePressed() {
	if (currentState === GameState.START) {
		if (typeof music_menu !== 'undefined' && !music_menu.isPlaying()) {
			userStartAudio();
			music_menu.loop();
			music_menu.setVolume(0.6);
		}
	}
	
	if (currentState === GameState.MICROGAME && currentMicrogame) {
		if (typeof currentMicrogame.mousePressed === 'function') {
			currentMicrogame.mousePressed();
		}
	}
}

function winMicrogame() {
	lastResultStatus = 'WIN';
	currentState = GameState.RESULT;
	hubTimer = 0;
	if (music_normal && music_normal.isPlaying()) music_normal.pause();
	if (typeof music_secretshape !== 'undefined' && music_secretshape.isPlaying()) music_secretshape.pause();
	if (music_vitoria) music_vitoria.play();
}

function loseMicrogame() {
	lastResultStatus = 'LOSE';
	currentState = GameState.RESULT;
	hubTimer = 0;
	if (music_normal && music_normal.isPlaying()) music_normal.pause();
	if (typeof music_secretshape !== 'undefined' && music_secretshape.isPlaying()) music_secretshape.pause();
	performExplosion();
}

function draw() {
	background(220);

	// Controle do phaseDiv: só aparece no HUB, TRANSITION e RESULT
	if (currentState === GameState.HUB || currentState === GameState.TRANSITION || currentState === GameState.RESULT) {
		if (phaseDiv.style('display') === 'none') phaseDiv.style('display', 'block');
		phaseDiv.html(nf(score, 3));
	} else {
		if (phaseDiv.style('display') !== 'none') phaseDiv.style('display', 'none');
	}
	// Lógica do aviso da música: só aparece no Start Menu SE a música não estiver tocando
	let hintEl = document.getElementById('musicHint');
	if (hintEl) {
		if (currentState === GameState.START && typeof music_menu !== 'undefined' && music_menu.isLoaded() && !music_menu.isPlaying()) {
			hintEl.style.display = 'block';
		} else {
			hintEl.style.display = 'none';
		}
	}

	// Máquina de estados principal do jogo
	if (currentState === GameState.START || currentState === GameState.HUB || currentState === GameState.GAME_OVER) {
		drawHubScene(); // Fundo + nave sempre visíveis no start, jogo em si e gameover
		
		if (currentState === GameState.HUB) {
			hubTimer++;
			if (hubTimer > 45) {
				currentState = GameState.TRANSITION;
				instructionText = "Mouse"; 
			}
		}
	} else if (currentState === GameState.TRANSITION) {
		drawTransitionPhase();
	} else if (currentState === GameState.MICROGAME) {
		if (currentMicrogame) {
			currentMicrogame.draw();
		}
		
		// Transição de Íris (Abrindo)
		if (hubTimer < 25) {
			let progress = hubTimer / 25.0;
			progress = 1 - Math.pow(1 - progress, 3); // ease-out
			drawIris(progress, 0, height * 0.1, true);
			hubTimer++;
		}
	} else if (currentState === GameState.RESULT) {
		drawHubScene();
		
		hubTimer++;
		let audioFinished = false;
		if (lastResultStatus === 'LOSE') {
			audioFinished = (!music_derrota || !music_derrota.isPlaying());
		} else {
			audioFinished = (!music_vitoria || !music_vitoria.isPlaying());
		}

		if (hubTimer > 20 && audioFinished) { 
			if (vidas <= 0) {
				currentState = GameState.PRE_GAME_OVER;
				hubTimer = 0;
				if (typeof music_insta_gameover !== 'undefined') music_insta_gameover.play();
			} else {
				currentState = GameState.HUB;
				hubTimer = 0;
				if (music_normal && !music_normal.isPlaying()) music_normal.play();
			}
		}
	} else if (currentState === GameState.PRE_GAME_OVER) {
		drawHubScene(); 
		hubTimer++;
		
		push();
		resetMatrix();
		ortho(-width / 2, width / 2, height / 2, -height / 2, 0, 1000);
		noLights();
		
		// Animação de impacto: Começa enorme e bate no tamanho original
		let sc = 1;
		if (hubTimer < 15) {
			sc = map(hubTimer, 0, 15, 3, 1);
		}
		
		translate(0, 0, 500); // Empurra a imagem para a frente da nave
		imageMode(CENTER);
		scale(1, -1); // Inverte porque image() no webgl fica de ponta cabeça
		scale(sc);
		
		if (gameOverGraphics) {
			image(gameOverGraphics, 0, 0);
		}
		pop();
		
		// Transição suave para o menu final HTML
		let audioDone = (!music_insta_gameover || !music_insta_gameover.isPlaying());
		if (hubTimer > 60 && audioDone) {
			triggerGameOver();
		}
	}
}
