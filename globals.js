const GameState = {
	START: "START",
	HUB: "HUB",
	TRANSITION: "TRANSITION",
	MICROGAME: "MICROGAME",
	RESULT: "RESULT",
	PRE_GAME_OVER: "PRE_GAME_OVER",
	GAME_OVER: "GAME_OVER",
	PAUSE: "PAUSE"
};

let currentState = GameState.START;

// Elementos HTML globais
let startButton;
let gameOverContainer;
let highscoresList;
let retryButton;
let quitButton;

// Overlay de Pausa
let pauseContainer;
let isPaused = false;
let stateBeforePause = null;

// Imagens e Texturas
let phaseDiv;
let textGraphics;
let gameOverGraphics;
let lifeGraphics;

// Variáveis de Jogo
let score = 0;
let highscores = [];
let vidas = 4;
let explosions = [];
let currentMicrogame = null;
let allMicrogames = ['SecretShape', 'BezierMatch', 'WhackABump', 'ClockMatch', 'LaserMirror'];
let availableMicrogames = [];
let hubTimer = 0;
let globalTime = 0; // Tempo independente de FPS
let shaderTime = 0; // Tempo acumulado do shader, permite aceleração
let dt = 1; 		// Delta time multiplier
let shipIntroTimer = 60; // Timer para a animação de entrada da nave
let isMuted = false; // Controle global de mute
let instructionText = "Mouse"; // Base
let lastResultStatus = 'WIN';

// Controle Visual
let drawShip = true;
let arwingModel;

// Recursos Globais (Shaders, Imagens, Áudios)
let my_shader;
let music_normal;
let music_vitoria;
let music_derrota;
let music_secretshape;
let music_clockmatch;
let music_lasermirror;
let audio_beziermatch;
let audio_bonk;
let music_gameover;
let music_insta_gameover;
let music_menu;
let audio_ai;
let audio_ou;
let audio_ui;

let voicelines_win = [];
let voicelines_lose = [];
let enableVoicelines = true; // Hardcoded: trocar para false para desativar as vozes de comemoração e derrota
let voicelineWinPool = [];
let voicelineLosePool = [];
let lastWinVoicelineIndex = -1;
let lastLoseVoicelineIndex = -1;

// Modo Desempenho
// 0 = Shader Resolução Máxima, 1 = Shader Resolução Baixa (Buffer), 2 = Imagem Estática
let performanceMode = 0;
let fpsDiv;
let warningOverlay;
let bgImage;
let fpsHistory = [];
let bgBuffer; 			// Buffer para o plano de fundo no modo desempenho 1
const bgScale = 0.4;  	// Escala para o buffer de fundo (40% da resolução original)
let bgShader; 			// Cópia do shader para o plano de fundo

// Speed Up Variables
let globalSpeedMultiplier = 1.0; // velocidade global inicial
let isSpeedingUp = false;
let lastSpeedUpScore = 0;
let speedUpBannerGraphics;
let audio_speedup;
