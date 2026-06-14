const GameState = {
	START: "START",
	HUB: "HUB",
	TRANSITION: "TRANSITION",
	MICROGAME: "MICROGAME",
	RESULT: "RESULT",
	PRE_GAME_OVER: "PRE_GAME_OVER",
	GAME_OVER: "GAME_OVER"
};

let currentState = GameState.START;

// Elementos HTML globais
let startButton;
let gameOverContainer;
let highscoresList;
let retryButton;
let quitButton;
let phaseDiv;
let textGraphics;
let gameOverGraphics;

// Variáveis de Jogo
let score = 0;
let highscores = [];
let vidas = 4;
let explosions = [];
let currentMicrogame = null;
let hubTimer = 0;
let instructionText = "Mouse"; // Base
let lastResultStatus = 'WIN';

// Recursos Globais (Shaders, Imagens, Áudios)
let my_shader;
let mouseImg;
let music_normal;
let music_vitoria;
let music_derrota;
let music_secretshape;
let music_gameover;
let music_insta_gameover;
let music_menu;

// Controle Visual
let drawShip = true;
let arwingModel;
