function setupStartUI() {
	// Título do Jogo (HTML Div)
	let titleDiv = createDiv('GRAPHICS WARE');
	titleDiv.id('gameTitle');
	titleDiv.style('position', 'absolute');
	titleDiv.style('width', '100%');
	titleDiv.style('text-align', 'center');
	titleDiv.style('top', '20%');
	titleDiv.style('font-size', '80px');
	titleDiv.style('font-family', "'Orbitron', sans-serif"); // Fonte espacial
	titleDiv.style('font-weight', '900');
	titleDiv.style('color', '#fff');
	titleDiv.style('text-shadow', '4px 4px 0px #ff5000');
	titleDiv.style('pointer-events', 'none'); // Para não bloquear o clique

	// Botão de Iniciar Jogo
	startButton = createButton('START GAME');
	startButton.id('startGameBtn');
	startButton.position(width / 2 - 100, height - 100);
	
	// Estilo base do botão
	startButton.size(200, 50);
	startButton.style('font-size', '24px');
	startButton.style('font-family', "'Orbitron', sans-serif"); // Fonte espacial
	startButton.style('font-weight', '700');
	startButton.style('color', '#fff');
	startButton.style('background-color', '#ff5000');
	startButton.style('border', 'none');
	startButton.style('border-radius', '10px');
	startButton.style('cursor', 'pointer');
	startButton.mousePressed(startGame);

	// Contador de FPS
	fpsDiv = createDiv('FPS: 0');
	fpsDiv.id('fpsCounter');
	fpsDiv.style('position', 'absolute');
	fpsDiv.style('top', '10px');
	fpsDiv.style('left', '10px');
	fpsDiv.style('font-family', "'Orbitron', sans-serif");
	fpsDiv.style('font-size', '20px');
	fpsDiv.style('color', '#0f0'); 
	fpsDiv.style('z-index', '100');
	fpsDiv.style('pointer-events', 'none');

	// Overlay de Aviso de Desempenho
	warningOverlay = createDiv('');
	warningOverlay.id('warningOverlay');
	warningOverlay.style('position', 'absolute');
	warningOverlay.style('top', '0');
	warningOverlay.style('left', '0');
	warningOverlay.style('width', '100vw');
	warningOverlay.style('height', '100vh');
	warningOverlay.style('background', 'rgba(0, 0, 0, 0.85)'); 
	warningOverlay.style('display', 'flex');
	warningOverlay.style('justify-content', 'center');
	warningOverlay.style('align-items', 'center');
	warningOverlay.style('z-index', '200');

	// Quadrilátero do Aviso
	let warningBox = createDiv('');
	warningBox.parent(warningOverlay);
	warningBox.style('background', 'rgba(20, 20, 20, 0.9)');
	warningBox.style('border', '2px solid #ff5000');
	warningBox.style('border-radius', '10px');
	warningBox.style('padding', '40px');
	warningBox.style('text-align', 'center');
	warningBox.style('max-width', '600px');
	warningBox.style('font-family', "'Orbitron', sans-serif");

	let warningTitle = createDiv('AVISO');
	warningTitle.parent(warningBox);
	warningTitle.style('color', '#ff5000');
	warningTitle.style('font-size', '32px');
	warningTitle.style('font-weight', '900');
	warningTitle.style('margin-bottom', '20px');

	// Texto do aviso
	let warningText = createDiv('Este jogo utiliza gráficos pesados por conta das animações e efeitos visuais. Se você notar que o jogo está travando, temos um Modo Desempenho para melhorar a jogabilidade.<br><br>Pressione <b>"N"</b> para <b>trocar de Modo Desempenho (temos um total de 3 opções), ele diminuirá a resolução do Raymarching de fundo</b>.<br><br>Clique em qualquer lugar da tela para fechar o aviso.');
	warningText.parent(warningBox);
	warningText.style('color', '#fff');
	warningText.style('font-size', '18px');
	warningText.style('line-height', '1.5');

	// Clicar faz o menu de aviso sumir
	warningOverlay.mousePressed(() => {
		warningOverlay.style('display', 'none');
	});
}

function startGame() {
	currentState = GameState.HUB;
	startButton.hide();
	let titleEl = document.getElementById('gameTitle');
	if (titleEl) titleEl.style.display = 'none';
	if (typeof music_menu !== 'undefined' && music_menu.isPlaying()) {
		music_menu.stop();
	}
	if (music_normal && !music_normal.isPlaying()) {
		music_normal.play();
	}
}
