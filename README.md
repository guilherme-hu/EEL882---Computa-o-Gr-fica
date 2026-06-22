
# Trabalho Final de Computação Gráfico

O meu trabalho se trata de um jogo composto por uma coletânea de minigames relacionados a Computação Gráfica, e é ganhando nesses minigames que você ganha pontos no jogo principal. Dentre os minigames que eu implementei estão:
1) Secret Shape: existe uma forma escura usando geometria 3D do P5 que você pode rotacionar, e você precisa descobrir qual o sólido via múltipla escolha
2) Bezier Match: encaixar uma curva de Bezier que você pode mexer os pontos de controle no padrão definido pelo jogo
3) Clock Match: girar os ponteiros do relógio para dar match no horário digital
4) LaserMirror: rotacionar espelhos de modo que o laser lançado sobre eles atinja o alvo
5) Whack A Bump: pontos de controle da superfície de B-splines sobem e você precisa apertar neles

O cenário do menu principal (hub) foi feito utilizando raymarching e a nave foi feita com geometria 3D do P5.js mesmo. Cada um dos meus minigames também se baseiam em algum conceito de Computação Gráfica: Geometria 3D (1), transformações (1 e 3), curvas de bezier (2), Ray Casting (4) e superfícies geométricas (5)


Comandos dentro do jogo:
B - troca o modo de desempenho (se seu FPS cair muito por conta do shader), existem 3 modos de desempenho: 0 - shader completo, 1 - shader com resolução menor, 2 - imagem girando;
N - mutar apenas as voicelines entre os minigames;
M - mutar todos os sons;
ESC - pausar o jogo;

Link do projeto no p5js:
https://editor.p5js.org/GuiHu/sketches/mvMPhJY3S
