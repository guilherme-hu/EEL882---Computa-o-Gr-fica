function preload() {
	// Shader do fundo
	my_shader = loadShader("shaders/shader.vert", "shaders/shader.frag");

	// Load de sons
	// Aúdios do jogo WarioWare Smooth Moves 
	// https://www.youtube.com/watch?v=j5hNgRom-3M
	// https://www.youtube.com/watch?v=-UewSOg2Qbs&list=PL7443260FEE96175F&index=47
	music_normal = loadSound("audios/orbulon.mp3");
	music_vitoria = loadSound("audios/orbulon_vit.mp3");
	music_derrota = loadSound("audios/orbulon_der.mp3");
	music_secretshape = loadSound("audios/secret_shape.mp3");
	music_clockmatch = loadSound("audios/clockmatch.mp3");
	music_lasermirror = loadSound("audios/laser.mp3");
	audio_beziermatch = loadSound("audios/bezier_match.mp3");
	audio_bonk = loadSound("audios/bonk.mp3");
	music_gameover = loadSound("audios/gameover.mp3");
	music_insta_gameover = loadSound("audios/insta_gameover.mp3");
	music_menu = loadSound("audios/menu.mp3"); // Instrumental da música "Recollect": https://youtu.be/IAlUCKYsI0U?si=0Ytkm9xjhfJNEiPO
	audio_speedup = loadSound("audios/speedup.mp3");
	audio_ai = loadSound("audios/ai.mp3");
	audio_ou = loadSound("audios/ou.mp3");
	audio_ui = loadSound("audios/ui.mp3");

	// Voicelines de vitória e derrota
	// Agradecimentos a minha irmã Shoga, Celeste e Betão
	voicelines_win = [
		{ sound: loadSound("audios/voicelines/etacomoebom.mp3"), vol: 2.0 },
		{ sound: loadSound("audios/voicelines/lessgo.mp3"), vol: 2.0 },
		{ sound: loadSound("audios/voicelines/nice.mp3"), vol: 2.0 },
		{ sound: loadSound("audios/voicelines/uhul.mp3"), vol: 2.0 },
		{ sound: loadSound("audios/voicelines/yayy.mp3"), vol: 1.0 },
		{ sound: loadSound("audios/voicelines/queaura.mp3"), vol: 2.0 },
		{ sound: loadSound("audios/voicelines/wahaa.mp3"), vol: 2.0 },
	];

	voicelines_lose = [
		{ sound: loadSound("audios/voicelines/ahmano.mp3"), vol: 2.0 },
		{ sound: loadSound("audios/voicelines/meudeus.mp3"), vol: 2.0 },
		{ sound: loadSound("audios/voicelines/nao.mp3"), vol: 2.0 },
		{ sound: loadSound("audios/voicelines/ohno.mp3"), vol: 2.0 },
		{ sound: loadSound("audios/voicelines/uque.mp3"), vol: 2.0 },
		{ sound: loadSound("audios/voicelines/comoassim.mp3"), vol: 2.0 },
		{ sound: loadSound("audios/voicelines/gah.mp3"), vol: 2.0 },
		{ sound: loadSound("audios/voicelines/queisso.mp3"), vol: 2.0 },
	];

	// Load de imagens
	bgImage = loadImage("images/fundo.png");
}

function setup() {
	createCanvas(windowWidth, windowHeight, WEBGL);
	frameRate(60);
	pixelDensity(1);
	noStroke();

	// Configurações para o plano de fundo no modo desempenho 1 - Buffer com shader renderizado em baixa resolução
	bgBuffer = createGraphics(max(1, floor(windowWidth * bgScale)), max(1, floor(windowHeight * bgScale)), WEBGL);
	bgBuffer.noStroke();
	bgShader = my_shader.copyToContext(bgBuffer);
	
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

	// Gráfico para a faixa SPEED UP
	speedUpBannerGraphics = createGraphics(800, 200);
	speedUpBannerGraphics.textAlign(CENTER, CENTER);
	speedUpBannerGraphics.textSize(120);
	speedUpBannerGraphics.textFont("'Impact', sans-serif"); 
	speedUpBannerGraphics.fill(255); // Branco puro
	speedUpBannerGraphics.stroke(0); 
	speedUpBannerGraphics.strokeWeight(8);
	speedUpBannerGraphics.text("SPEED UP!", 400, 100);

	// Gráfico cacheado para as vidas (fogo)
	lifeGraphics = createGraphics(160, 160);
	lifeGraphics.translate(80, 80);
	lifeGraphics.scale(2); // Desenha maior para não perder qualidade ao escalar na tela
	lifeGraphics.stroke(0);
	lifeGraphics.strokeWeight(1);
	lifeGraphics.fill(255, 80, 0);
	lifeGraphics.beginShape(); // Parte externa da chama
	lifeGraphics.vertex(0, 35); 
	lifeGraphics.bezierVertex(35, 5, 35, -35, 0, -35); 
	lifeGraphics.bezierVertex(-35, -35, -35, 5, 0, 35);
	lifeGraphics.endShape(CLOSE);
	lifeGraphics.noStroke(); // Parte interna da chama 
	lifeGraphics.fill(255, 220, 0);
	lifeGraphics.beginShape();
	lifeGraphics.vertex(0, 15);
	lifeGraphics.bezierVertex(18, -5, 18, -25, 0, -25);
	lifeGraphics.bezierVertex(-18, -25, -18, -5, 0, 15);
	lifeGraphics.endShape(CLOSE);
	lifeGraphics.fill(255);
	lifeGraphics.ellipse(0, -18, 12, 12); // Centro do fogo
	
	// Converter p5.Graphics para p5.Image estática 
	let img = createImage(lifeGraphics.width, lifeGraphics.height);
	img.copy(lifeGraphics, 0, 0, lifeGraphics.width, lifeGraphics.height, 0, 0, lifeGraphics.width, lifeGraphics.height);
	lifeGraphics = img;

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
	
	// Configurações das interfaces de cada estado
	setupStartUI();
	setupGameOverUI();
	setupPauseUI();
	
	// Compila o modelo estático da nave para a VBO (GPU) apenas uma vez
	if (typeof buildArwingModel === 'function') {
		arwingModel = buildArwingModel();
	}
}

function windowResized() {
	resizeCanvas(windowWidth, windowHeight);
	if (bgBuffer) {
		bgBuffer.resizeCanvas(max(1, floor(windowWidth * bgScale)), max(1, floor(windowHeight * bgScale)));
	}
	if (startButton) {
		startButton.position(width / 2 - 100, height - 100);
	}
	if (gameOverContainer) {
		gameOverContainer.size(windowWidth, windowHeight);
	}
	if (pauseContainer) {
		pauseContainer.size(windowWidth, windowHeight);
	}
	if (phaseDiv) {
		phaseDiv.style('width', `${windowWidth}px`);
	}
}

// Atalhos do jogo para teste e debug
function keyPressed() {
	if (keyCode === ESCAPE) {
		togglePause();
	}
	
	// Alterna o Modo Desempenho entre os 3 níveis a qualquer momento apertando 'N'
	if (key === 'n' || key === 'N') {
		performanceMode = (performanceMode + 1) % 3; // Cicla entre 0, 1 e 2
		
		// Se a tela de aviso ainda estiver aberta, fecha ela
		if (typeof warningOverlay !== 'undefined' && warningOverlay && warningOverlay.style('display') !== 'none') {
			warningOverlay.style('display', 'none');
			// Toca a música do menu se não estiver tocando caso jogador use N para tirar aviso
			if (typeof music_menu !== 'undefined' && !music_menu.isPlaying()) {
				music_menu.loop();
				music_menu.setVolume(0.6);
			}
		}
		return; 
	}

	// Se houver overlay e não for 'N', ignora outros atalhos até fechar
	if (typeof warningOverlay !== 'undefined' && warningOverlay && warningOverlay.style('display') !== 'none') {
		return; 
	}


	// Atalho para mutar o som do jogo (M)
	if (key === 'm' || key === 'M') {
		isMuted = !isMuted;
		if (typeof outputVolume === 'function') {
			outputVolume(isMuted ? 0 : 1);
		}
		return;
	}

	if (currentState === GameState.START) return; 

	// // L para perder vida (ou resetar vidas se já estiver em 0)
	// if (key === 'l' || key === 'L') {
	// 	if (vidas > 0) {
	// 		performExplosion();
	// 	} else {
	// 		vidas = 4; 
	// 	}
	// }
	
	// // K para ganhar vida (limite de 4 para manter a interface correta)
	// if (key === 'k' || key === 'K') {
	// 	if (vidas < 4) {
	// 		vidas++;
	// 	}
	// }
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
		// Toca a música do menu assim que o jogador tira o menu de aviso por clique de mouse
		if (typeof music_menu !== 'undefined' && !music_menu.isPlaying()) {
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

function mouseReleased() {
	if (currentState === GameState.MICROGAME && currentMicrogame) {
		if (typeof currentMicrogame.mouseReleased === 'function') {
			currentMicrogame.mouseReleased();
		}
	}
}

function winMicrogame() {
	lastResultStatus = 'WIN';
	currentState = GameState.RESULT;
	hubTimer = 0;

	// Verificação de segurança de audios + audio de vitoria
	if (music_normal && music_normal.isPlaying()) music_normal.stop();
	if (typeof music_secretshape !== 'undefined' && music_secretshape.isPlaying()) music_secretshape.stop();
	if (typeof music_clockmatch !== 'undefined' && music_clockmatch.isPlaying()) music_clockmatch.stop();
	if (typeof music_lasermirror !== 'undefined' && music_lasermirror.isPlaying()) music_lasermirror.stop();
	if (typeof audio_beziermatch !== 'undefined' && audio_beziermatch.isPlaying()) audio_beziermatch.stop();
	if (typeof audio_bonk !== 'undefined' && audio_bonk.isPlaying()) audio_bonk.stop();
	if (music_vitoria) music_vitoria.play();
}

// Variáveis para evitar repetição consecutiva de áudio
let lastWinVl = null;
let lastLoseVl = null;

// Toca a voiceline assim que a condição de vitória é atingida dentro do minigame
function playWinVoiceline() {
	if (enableVoicelines && !isMuted && voicelines_win && voicelines_win.length > 0) {
		let vl = random(voicelines_win);
		// Previne repetição imediata se houver mais de 1 opção
		if (voicelines_win.length > 1) {
			while (vl === lastWinVl) {
				vl = random(voicelines_win);
			}
		}
		lastWinVl = vl;
		vl.sound.setVolume(vl.vol);
		vl.sound.play();
	}
}

function loseMicrogame() {
	lastResultStatus = 'LOSE';
	currentState = GameState.RESULT;
	hubTimer = 0;

	// Verificação de segurança de audios + audio de derrota
	if (music_normal && music_normal.isPlaying()) music_normal.stop();
	if (typeof music_secretshape !== 'undefined' && music_secretshape.isPlaying()) music_secretshape.stop();
	if (typeof music_clockmatch !== 'undefined' && music_clockmatch.isPlaying()) music_clockmatch.stop();
	if (typeof music_lasermirror !== 'undefined' && music_lasermirror.isPlaying()) music_lasermirror.stop();
	if (typeof audio_beziermatch !== 'undefined' && audio_beziermatch.isPlaying()) audio_beziermatch.stop();
	if (typeof audio_bonk !== 'undefined' && audio_bonk.isPlaying()) audio_bonk.stop();
	if (music_derrota) music_derrota.play();

	// Explode turbina e perda vida
	performExplosion();

	// Toca uma voiceline aleatória de derrota
	if (enableVoicelines && !isMuted && voicelines_lose.length > 0) {
		let vl = random(voicelines_lose);
		// Previne repetição imediata
		if (voicelines_lose.length > 1) {
			while (vl === lastLoseVl) {
				vl = random(voicelines_lose);
			}
		}
		lastLoseVl = vl;
		vl.sound.setVolume(vl.vol);
		vl.sound.play();
	}
}

function draw() {
	// Calcula o Delta Time (1.0 = rodando perfeitamente a 60FPS. 2.0 = rodando a 30FPS)
	// Serve para acelerar o jogo pelos Speed Ups + controle de tempo independente do FPS
	dt = (Math.min(deltaTime, 100) / (1000 / 60)) * globalSpeedMultiplier;
	globalTime += dt;

	if (shipIntroTimer > 0) {
		shipIntroTimer -= dt;
		if (shipIntroTimer < 0) shipIntroTimer = 0;
	}

	// Atualiza o tempo do shader com animações
	let timeMultiplier = 1.0;
	if (currentState === GameState.RESULT) {
		if (lastResultStatus === 'WIN') {
			if (hubTimer < 90) {
				let p = hubTimer / 90.0;
				// Acelera no meio da animação (pico em p=0.5)
				timeMultiplier = 1.0 + sin(p * PI) * 8.0; 
			}
		} else if (lastResultStatus === 'LOSE') {
			if (hubTimer < 90) {
				let p = hubTimer / 90.0;
				// Desacelera no meio da animação, quase parando
				timeMultiplier = 1.0 - sin(p * PI) * 0.9; 
			}
		}
	}
	shaderTime += (deltaTime / 1000.0) * timeMultiplier * globalSpeedMultiplier;

	// Atualiza o FPS apenas a cada 10 frames para evitar reflow no navegador
	if (typeof fpsDiv !== 'undefined' && fpsDiv && frameCount % 10 === 0) {
		let currentFps = frameRate();
		fpsHistory.push(currentFps);
		if (fpsHistory.length > 60) {
			fpsHistory.shift();
		}
		
		let sum = 0;
		for (let i = 0; i < fpsHistory.length; i++) {
			sum += fpsHistory[i];
		}
		let fpsAvg = sum / fpsHistory.length;
		
		fpsDiv.html(`FPS: ${floor(currentFps)} <span style="margin-left: 15px; font-size: 16px; color: #8f8;">Média: ${floor(fpsAvg)}</span>`);
	}

	background(0);

	// Controle do phaseDiv: só aparece no HUB, TRANSITION e RESULT
	if (typeof window.phaseDivVisible === 'undefined') window.phaseDivVisible = false;

	if (currentState === GameState.HUB || currentState === GameState.TRANSITION || currentState === GameState.RESULT) {
		if (!window.phaseDivVisible) {
			phaseDiv.style('display', 'block');
			window.phaseDivVisible = true;
		}
		// Atualiza o texto apenas se o valor mudou
		if (window.lastScoreDisplayed !== score) {
			phaseDiv.html(nf(score, 3));
			window.lastScoreDisplayed = score;
		}
	} else {
		if (window.phaseDivVisible) {
			phaseDiv.style('display', 'none');
			window.phaseDivVisible = false;
		}
	}

	// Máquina de estados principal do jogo
	if (currentState === GameState.START || currentState === GameState.HUB || currentState === GameState.GAME_OVER) {
		drawHubScene(); // Fundo + nave sempre visíveis no start, jogo em si e gameover
		
		if (currentState === GameState.HUB) {
			if (isSpeedingUp) {
				// Evento de Speed Up!
				push();
				resetMatrix();
				ortho(-width / 2, width / 2, height / 2, -height / 2, 0, 1000);
				noLights();
				
				// Faixa horizontal que pulsa
				let pulse = 1.0 + sin(frameCount * 0.2) * 0.1;
				translate(0, 0, 500); // Traz para a frente da nave
				imageMode(CENTER);
				scale(1, -1); // Inverte Y
				scale(pulse);
				
				if (speedUpBannerGraphics) {
					image(speedUpBannerGraphics, 0, 0);
				}
				pop();
				
				// Checa se a música de speed up acabou
				if (audio_speedup && !audio_speedup.isPlaying()) {
					isSpeedingUp = false;
					globalSpeedMultiplier *= 1.1;
					updateAudioRates(); // Atualiza a velocidade das músicas
					lastSpeedUpScore = score;
					
					if (music_normal && !music_normal.isPlaying()) {
						music_normal.play();
					}
				}
			} else {
				// Verifica se precisa engatilhar o speed up (após voltar de um minigame onde o score ficou múltiplo de 5)
				if (score > 0 && score % 5 === 0 && lastSpeedUpScore !== score) {
					isSpeedingUp = true;
					if (music_normal && music_normal.isPlaying()) music_normal.pause();
					if (audio_speedup) audio_speedup.play();
				} else {
					hubTimer += dt;
					if (hubTimer > 45) {
						currentState = GameState.TRANSITION;
						instructionText = "Mouse"; 
					}
				}
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
			hubTimer += dt;
		}
	} else if (currentState === GameState.RESULT) {
		drawHubScene();
		
		hubTimer += dt;
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
		hubTimer += dt;
		
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

function updateAudioRates() {
	let r = globalSpeedMultiplier;
	if (music_normal) music_normal.rate(r);
	if (music_vitoria) music_vitoria.rate(r);
	if (music_derrota) music_derrota.rate(r);
	if (typeof music_secretshape !== 'undefined') music_secretshape.rate(r);
	if (typeof audio_beziermatch !== 'undefined') audio_beziermatch.rate(r);
	if (typeof audio_bonk !== 'undefined') audio_bonk.rate(r);
	if (music_clockmatch) music_clockmatch.rate(r);
	if (music_lasermirror) music_lasermirror.rate(r);
	if (typeof audio_speedup !== 'undefined' && audio_speedup) audio_speedup.rate(r);
	if (voicelines_win) {
		for (let vl of voicelines_win) vl.sound.rate(r);
	}
	if (voicelines_lose) {
		for (let vl of voicelines_lose) vl.sound.rate(r);
	}
	if (typeof audio_ai !== 'undefined' && audio_ai) audio_ai.rate(r);
	if (typeof audio_ou !== 'undefined' && audio_ou) audio_ou.rate(r);
	if (typeof audio_ui !== 'undefined' && audio_ui) audio_ui.rate(r);	
}
