function setupPauseUI() {
	pauseContainer = createDiv();
	pauseContainer.position(0, 0);
	pauseContainer.size(windowWidth, windowHeight);
	pauseContainer.style('background-color', 'rgba(0, 0, 0, 0.8)');
	pauseContainer.style('display', 'none'); // Escondido por padrão
	pauseContainer.style('flex-direction', 'column');
	pauseContainer.style('align-items', 'center');
	pauseContainer.style('justify-content', 'center');
	pauseContainer.style('z-index', '500'); // Fica na frente de tudo

	let pauseTitle = createDiv('PAUSED');
	pauseTitle.parent(pauseContainer);
	pauseTitle.style('font-family', "'Orbitron', sans-serif");
	pauseTitle.style('font-size', '80px');
	pauseTitle.style('font-weight', '900');
	pauseTitle.style('color', '#fff');
	pauseTitle.style('margin-bottom', '40px');
	pauseTitle.style('text-shadow', '4px 4px 0px #444');

	let buttonsDiv = createDiv();
	buttonsDiv.parent(pauseContainer);
	buttonsDiv.style('display', 'flex');
	buttonsDiv.style('flex-direction', 'column');
	buttonsDiv.style('gap', '20px');

	let continueBtn = createButton('CONTINUE');
	continueBtn.parent(buttonsDiv);
	stylePauseButton(continueBtn, '#00cc66');
	continueBtn.mousePressed(resumeFromPause);

	let retryBtn = createButton('RETRY');
	retryBtn.parent(buttonsDiv);
	stylePauseButton(retryBtn, '#ff5000');
	retryBtn.mousePressed(retryFromPause);

	let quitBtn = createButton('QUIT');
	quitBtn.parent(buttonsDiv);
	stylePauseButton(quitBtn, '#555');
	quitBtn.mousePressed(quitFromPause);
}

function stylePauseButton(btn, bgColor) {
	btn.size(300, 60);
	btn.style('font-size', '24px');
	btn.style('font-family', "'Orbitron', sans-serif");
	btn.style('font-weight', '700');
	btn.style('color', '#fff');
	btn.style('background-color', bgColor);
	btn.style('border', 'none');
	btn.style('border-radius', '10px');
	btn.style('cursor', 'pointer');
}

function togglePause() {
	if (currentState === GameState.START || currentState === GameState.PRE_GAME_OVER || currentState === GameState.GAME_OVER) {
		return; // Não pode pausar nestas telas
	}

	if (!isPaused) {
		// PAUSAR JOGO
		stateBeforePause = currentState;
		currentState = GameState.PAUSE;
		isPaused = true;
		
		getAudioContext().suspend(); // Pausa todo o áudio do jogo simultaneamente
		noLoop(); // Congela o `draw()` do p5.js mantendo o frame congelado na tela
		
		pauseContainer.style('display', 'flex');
	} else {
		resumeFromPause();
	}
}

function resumeFromPause() {
	if (!isPaused) return;
	
	isPaused = false;
	currentState = stateBeforePause;
	pauseContainer.style('display', 'none');
	
	getAudioContext().resume(); // Retoma o áudio de onde parou
	loop(); // Retoma o `draw()`
}

function retryFromPause() {
	resumeFromPause(); // Restaura loop e audioContext
	
	// Para a música do microgame atual se houver
	stopAllMicrogameMusic();
	
	retryGame(); // Chama a mesma função que o GameOver usa
}

function quitFromPause() {
	resumeFromPause(); // Restaura loop e audioContext
	
	// Para a música do microgame atual se houver
	stopAllMicrogameMusic();
	
	quitGame(); // Chama a mesma função que o GameOver usa
}

function stopAllMicrogameMusic() {
	if (typeof music_secretshape !== 'undefined' && music_secretshape.isPlaying()) music_secretshape.stop();
	if (typeof music_clockmatch !== 'undefined' && music_clockmatch.isPlaying()) music_clockmatch.stop();
	if (typeof music_lasermirror !== 'undefined' && music_lasermirror.isPlaying()) music_lasermirror.stop();
	if (typeof audio_beziermatch !== 'undefined' && audio_beziermatch.isPlaying()) audio_beziermatch.stop();
	if (typeof audio_bonk !== 'undefined' && audio_bonk.isPlaying()) audio_bonk.stop();
}
