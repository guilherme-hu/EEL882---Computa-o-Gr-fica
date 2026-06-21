function setupGameOverUI() {
	gameOverContainer = createDiv();
	gameOverContainer.position(0, 0);
	gameOverContainer.size(windowWidth, windowHeight);
	gameOverContainer.style('background-color', 'rgba(0, 0, 0, 0.7)');
	gameOverContainer.style('display', 'none'); // Escondido por padrão
	gameOverContainer.style('flex-direction', 'column');
	gameOverContainer.style('align-items', 'center');
	gameOverContainer.style('justify-content', 'center');
	gameOverContainer.style('z-index', '10');
	gameOverContainer.style('opacity', '0');
	gameOverContainer.style('transition', 'opacity 2s ease-in-out');

	let goTitle = createDiv('GAME OVER');
	goTitle.parent(gameOverContainer);
	goTitle.style('font-family', "'Orbitron', sans-serif");
	goTitle.style('font-size', '80px');
	goTitle.style('font-weight', '900');
	goTitle.style('color', '#fff');
	goTitle.style('margin-bottom', '20px');
	goTitle.style('text-shadow', '4px 4px 0px #fe6464');

	let currentScoreDiv = createDiv('');
	currentScoreDiv.id('currentScoreDiv');
	currentScoreDiv.parent(gameOverContainer);
	currentScoreDiv.style('font-family', "'Orbitron', sans-serif");
	currentScoreDiv.style('font-size', '28px');
	currentScoreDiv.style('color', '#fff');
	currentScoreDiv.style('margin-bottom', '30px');

	let scoresTitle = createDiv('HIGHSCORES');
	scoresTitle.parent(gameOverContainer);
	scoresTitle.style('font-family', "'Orbitron', sans-serif");
	scoresTitle.style('font-size', '24px');
	scoresTitle.style('color', '#aaa');
	scoresTitle.style('margin-bottom', '15px');

	highscoresList = createDiv('');
	highscoresList.parent(gameOverContainer);
	highscoresList.style('font-family', "'Orbitron', sans-serif");
	highscoresList.style('font-size', '20px');
	highscoresList.style('color', '#fff');
	highscoresList.style('text-align', 'left');
	highscoresList.style('line-height', '1.5');
	highscoresList.style('margin-bottom', '40px');

	let buttonsDiv = createDiv();
	buttonsDiv.parent(gameOverContainer);
	buttonsDiv.style('display', 'flex');
	buttonsDiv.style('gap', '20px');

	retryButton = createButton('RETRY');
	retryButton.parent(buttonsDiv);
	styleGameOverButton(retryButton, '#ff5000');
	retryButton.mousePressed(retryGame);

	quitButton = createButton('QUIT');
	quitButton.parent(buttonsDiv);
	styleGameOverButton(quitButton, '#555');
	quitButton.mousePressed(quitGame);
}

function styleGameOverButton(btn, bgColor) {
	btn.style('font-size', '24px');
	btn.style('font-family', "'Orbitron', sans-serif");
	btn.style('font-weight', '700');
	btn.style('color', '#fff');
	btn.style('background-color', bgColor);
	btn.style('border', 'none');
	btn.style('border-radius', '10px');
	btn.style('padding', '10px 30px');
	btn.style('cursor', 'pointer');
}

function triggerGameOver() {
	currentState = GameState.GAME_OVER;
	if (phaseDiv) phaseDiv.style('display', 'none');
	
	if (music_normal && music_normal.isPlaying()) {
		music_normal.stop();
	}
	if (typeof music_secretshape !== 'undefined' && music_secretshape.isPlaying()) {
		music_secretshape.stop();
	}
	if (typeof music_clockmatch !== 'undefined' && music_clockmatch.isPlaying()) {
		music_clockmatch.stop();
	}
	if (typeof music_lasermirror !== 'undefined' && music_lasermirror.isPlaying()) {
		music_lasermirror.stop();
	}
	if (typeof audio_beziermatch !== 'undefined' && audio_beziermatch.isPlaying()) {
		audio_beziermatch.stop();
	}
	if (typeof audio_bonk !== 'undefined' && audio_bonk.isPlaying()) {
		audio_bonk.stop();
	}	
	
	if (typeof music_gameover !== 'undefined' && !music_gameover.isPlaying()) {
		music_gameover.loop();
	}
	
	let finalScore = score > 0 ? score : floor(random(1, 15)); // Random para teste se for 0
	
	// Exibe pontuação atual
	let scoreEl = document.getElementById('currentScoreDiv');
	if (scoreEl) scoreEl.innerHTML = `Sua pontuação: <span style="color:#ff5000">${finalScore} pts</span>`;

	// Atualiza e ordena os highscores
	highscores.push(finalScore);
	highscores.sort((a, b) => b - a); // Ordem decrescente
	if (highscores.length > 5) {
		highscores.length = 5; // Mantém só os top 5
	}
	
	// Monta a lista formatada
	let scoresHtml = '';
	for (let i = 0; i < 5; i++) {
		let s = highscores[i] !== undefined ? `${highscores[i]} pts` : '---';
		scoresHtml += `${i + 1}. ${s}<br>`;
	}
	if (highscoresList) highscoresList.html(scoresHtml);
	
	if (gameOverContainer) {
		gameOverContainer.style('transition', 'none'); // Reseta a transição
		gameOverContainer.style('display', 'flex');
		gameOverContainer.style('opacity', '0');
		// Pequeno delay para garantir que o display 'flex' aplicou antes de mudar opacity
		setTimeout(() => {
			gameOverContainer.style('transition', 'opacity 2s ease-in-out');
			gameOverContainer.style('opacity', '1');
		}, 50);
	}
}

function retryGame() {
	vidas = 4;
	score = 0;
	explosions = [];
	hubTimer = 0;
	shipIntroTimer = 60;
	gameOverContainer.style('transition', 'none'); 
	gameOverContainer.style('opacity', '0');
	gameOverContainer.hide();
	currentState = GameState.HUB;
	
	// Áudios parados
	if (typeof music_gameover !== 'undefined' && music_gameover.isPlaying()) {
		music_gameover.stop();
	}
	if (music_normal && music_normal.isPlaying()) {
		music_normal.stop();
	}
	if (typeof music_secretshape !== 'undefined' && music_secretshape.isPlaying()) {
		music_secretshape.stop();
	}
	if (typeof music_clockmatch !== 'undefined' && music_clockmatch.isPlaying()) {
		music_clockmatch.stop();
	}
	if (typeof music_lasermirror !== 'undefined' && music_lasermirror.isPlaying()) {
		music_lasermirror.stop();
	}
	if (typeof audio_beziermatch !== 'undefined' && audio_beziermatch.isPlaying()) {
		audio_beziermatch.stop();
	}
	if (typeof audio_bonk !== 'undefined' && audio_bonk.isPlaying()) {
		audio_bonk.stop();
	}	
	
	// Reseta Speed Up
	globalSpeedMultiplier = 1.0;
	lastSpeedUpScore = 0;
	isSpeedingUp = false;
	if (typeof updateAudioRates === 'function') updateAudioRates();

	if (music_normal && !music_normal.isPlaying()) {
		music_normal.play();
	}
}

function quitGame() {
	vidas = 4;
	score = 0;
	explosions = [];
	hubTimer = 0;
	shipIntroTimer = 60;
	gameOverContainer.style('transition', 'none'); 
	gameOverContainer.style('opacity', '0');
	gameOverContainer.hide();
	currentState = GameState.START;
	if (startButton) startButton.show();
	let titleEl = document.getElementById('gameTitle');
	if (titleEl) titleEl.style.display = 'block';
	
	// Áudios parados
	if (typeof music_gameover !== 'undefined' && music_gameover.isPlaying()) {
		music_gameover.stop();
	}
	if (music_normal && music_normal.isPlaying()) {
		music_normal.stop();
	}
	if (typeof music_secretshape !== 'undefined' && music_secretshape.isPlaying()) {
		music_secretshape.stop();
	}
	if (typeof music_clockmatch !== 'undefined' && music_clockmatch.isPlaying()) {
		music_clockmatch.stop();
	}
	if (typeof music_lasermirror !== 'undefined' && music_lasermirror.isPlaying()) {
		music_lasermirror.stop();
	}
	if (typeof audio_beziermatch !== 'undefined' && audio_beziermatch.isPlaying()) {
		audio_beziermatch.stop();
	}
	if (typeof audio_bonk !== 'undefined' && audio_bonk.isPlaying()) {
		audio_bonk.stop();
	}	
	
	// Volta a tocar a música do menu principal
	if (typeof music_menu !== 'undefined' && !music_menu.isPlaying()) {
		music_menu.loop();
	}
	
	// Reseta Speed Up
	globalSpeedMultiplier = 1.0;
	lastSpeedUpScore = 0;
	isSpeedingUp = false;
	if (typeof updateAudioRates === 'function') updateAudioRates();
}