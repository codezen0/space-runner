
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let playerx = 50;
let playery = 300;
let playerWidth = 50;
let playerHeight = 40;
let playerColor = '#00ffcc';

let enemies = [];
const enemyWidth = 50;
const enemyHeight = 50;
const enemyColor = '#8b8589';
const enemySpeed = 5;

let isPaused = false;
let isGameOver = false;
let gameRunning = false;

function spawnEnemies() {
    enemies = [
        { x: 800, y: 100 },
        { x: 1100, y: 250 },
        { x: 1400, y: 400 }
    ];
}

function drawPlayer() {
    ctx.fillStyle = playerColor;
    ctx.beginPath();
    // Triangular space ship pointing right
    ctx.moveTo(playerx, playery);
    ctx.lineTo(playerx + playerWidth, playery + playerHeight / 2);
    ctx.lineTo(playerx, playery + playerHeight);
    ctx.lineTo(playerx + playerWidth / 4, playery + playerHeight / 2);
    ctx.closePath();
    ctx.fill();
}

function drawEnemies() {
    enemies.forEach(enemy => {
        ctx.fillStyle = enemyColor;
        const radius = enemyWidth / 2;
        const cx = enemy.x + radius;
        const cy = enemy.y + radius;

        // Draw a bumpy asteroid shape
        ctx.beginPath();
        for (let i = 0; i < 10; i++) {
            const angle = (i / 10) * Math.PI * 2;
            const bump = i % 2 === 0 ? 0.85 : 1.1;
            const x = cx + Math.cos(angle) * radius * bump;
            const y = cy + Math.sin(angle) * radius * bump;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();

        // Draw craters
        ctx.fillStyle = '#555';
        ctx.beginPath();
        ctx.arc(cx - radius / 3, cy - radius / 4, radius / 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(cx + radius / 4, cy + radius / 3, radius / 5, 0, Math.PI * 2);
        ctx.fill();
    });
}

function update() {
    enemies.forEach(enemy => {
        // Move enemies to the left
        enemy.x -= enemySpeed;

        // Infinite respawn once it goes offscreen
        if (enemy.x + enemyWidth < 0) {
            enemy.x = canvas.width + Math.random() * 300;
            enemy.y = Math.random() * (canvas.height - enemyHeight);
        }

        // Collision detection
        if (
            playerx < enemy.x + enemyWidth &&
            playerx + playerWidth > enemy.x &&
            playery < enemy.y + enemyHeight &&
            playery + playerHeight > enemy.y
        ) {
            gameOver();
        }
    });
}

function gameLoop() {
    if (!gameRunning || isPaused || isGameOver) return;
    update();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawPlayer();
    drawEnemies();
    requestAnimationFrame(gameLoop);
}

// Hide all menus except the start menu
function initUI() {
    document.getElementById('startMenu').style.display = 'flex';
    document.getElementById('pauseMenu').style.display = 'none';
    document.getElementById('gameOverMenu').style.display = 'none';
    document.getElementById('highScoreMenu').style.display = 'none';
}

function startGame() {
    document.getElementById('startMenu').style.display = 'none';
    spawnEnemies();
    gameRunning = true;
    isPaused = false;
    isGameOver = false;
    gameLoop();
}

function pauseGame() {
    isPaused = true;
    document.getElementById('pauseMenu').style.display = 'flex';
}

function resumeGame() {
    isPaused = false;
    document.getElementById('pauseMenu').style.display = 'none';
    gameLoop();
}

function gameOver() {
    isGameOver = true;
    document.getElementById('gameOverMenu').style.display = 'flex';
}

function restartGame() {
    document.getElementById('gameOverMenu').style.display = 'none';
    playerx = 50;
    playery = 300;
    spawnEnemies();
    isGameOver = false;
    isPaused = false;
    gameRunning = true;
    gameLoop();
}

function quitGame() {
    document.getElementById('gameOverMenu').style.display = 'none';
    document.getElementById('pauseMenu').style.display = 'none';
    gameRunning = false;
    initUI();
}

function showHighScore() {
    document.getElementById('highScoreMenu').style.display = 'flex';
}

function hideHighScore() {
    document.getElementById('highScoreMenu').style.display = 'none';
}

// Event Listeners
document.addEventListener('keydown', (e) => {
    if (!gameRunning || isGameOver) return;

    if (e.key === 'w') {
        playery = Math.max(0, playery - 15);
    }
    if (e.key === 's') {
        playery = Math.min(canvas.height - playerHeight, playery + 15);
    }
    if (e.key === 'a') {
        playerx = Math.max(0, playerx - 15);
    }
    if (e.key === 'd') {
        playerx = Math.min(canvas.width - playerWidth, playerx + 15);
    }
    if (e.key === 'p' || e.key === 'P') {
        if (isPaused) {
            resumeGame();
        } else {
            pauseGame();
        }
    }
});

document.getElementById('startButton').addEventListener('click', startGame);

const resumeButton = document.getElementById('resumeButton');
if (resumeButton) {
    resumeButton.addEventListener('click', resumeGame);
}

const restartButton = document.getElementById('restartButton');
if (restartButton) {
    restartButton.addEventListener('click', restartGame);
}

const quitButton = document.getElementById('quitButton');
if (quitButton) {
    quitButton.addEventListener('click', quitGame);
}

const highScoreButton = document.getElementById('highScoreButton');
if (highScoreButton) {
    highScoreButton.addEventListener('click', showHighScore);
}

const closeHighScoreButton = document.getElementById('closeHighScoreButton');
if (closeHighScoreButton) {
    closeHighScoreButton.addEventListener('click', hideHighScore);
}

// Initialize UI on load
initUI();

