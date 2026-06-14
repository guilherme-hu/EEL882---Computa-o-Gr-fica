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

	// Texto piscante para ligar a música
	let musicHintDiv = createDiv('Aperte em qualquer lugar para começar a música!');
	musicHintDiv.id('musicHint');
	musicHintDiv.style('position', 'absolute');
	musicHintDiv.style('width', '100%');
	musicHintDiv.style('text-align', 'center');
	musicHintDiv.style('bottom', '120px');
	musicHintDiv.style('font-size', '20px');
	musicHintDiv.style('font-family', "'Orbitron', sans-serif");
	musicHintDiv.style('color', '#fff');
	musicHintDiv.style('pointer-events', 'none');
	musicHintDiv.style('display', 'none'); // escondido inicialmente
	
	// CSS inline para a animação de piscar
	let styleSheet = document.createElement("style");
	styleSheet.innerText = `
		@keyframes flashHint {
			0% { opacity: 1; }
			50% { opacity: 0.1; }
			100% { opacity: 1; }
		}
		#musicHint {
			animation: flashHint 1.5s infinite;
		}
	`;
	document.head.appendChild(styleSheet);

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
