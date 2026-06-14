
// Boss Assets
const bossList = [
    { name: "POGSHIT LORD", img: "/img/pogshit.png", color: "violet" },
    { name: "TASGA BOY", img: "/img/tasga_boy.jpg", color: "cyan" },
    { name: "KOREAN BOY", img: "/img/korean_boy.jpg", color: "orange" }
];
let currentBossIndex = 0;

const bossImages = bossList.map(b => {
    const img = new Image();
    img.src = b.img;
    return img;
});

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
const enemySpeed = 8;

let coins = [];
const coinRadius = 12;
const coinWidth = coinRadius * 2;
const coinHeight = coinRadius * 2;
const coinColor = '#FFD700';
const coinSpeed = 6;
let coinCount = 0;

let isPaused = false;
let isGameOver = false;
let gameRunning = false;

// Upgrade States
let shieldCount = 0;
let hasWeapon = false;
let isInvincible = false;

// Boss States
let bossActive = false;
let bossHP = 100;
let bossProjectiles = [];
let bossY = 0;
let gameTime = 0; // in seconds
let bossAlertTimer = 0; // for showing the on-screen warning
let bossDuration = 0; // tracking how long boss has been active
let survivalAlertTimer = 0; // for the success message

const keys = {};
const playerSpeed = 7;

function spawnEnemies() {
    enemies = [
        { x: 900, y: 150 },
        { x: 1200, y: 350 },
        { x: 1500, y: 500 }
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

function drawCoins() {
    coins.forEach(coin => {
        ctx.fillStyle = coinColor;
        ctx.beginPath();
        ctx.arc(coin.x, coin.y, coinRadius, 0, Math.PI * 2);
        ctx.fill();
    });
}

function spawnCoins() {
    coins = [
        { x: 800, y: 100 },
        { x: 1100, y: 250 },
        { x: 1400, y: 450 }
    ];
}

function updateCoins() {
    coins.forEach(coin => {
        // Move coins to the left
        coin.x -= coinSpeed;

        // Infinite respawn once it goes offscreen
        if (coin.x + coinWidth < 0) {
            coin.x = canvas.width + Math.random() * 300;
            coin.y = Math.random() * (canvas.height - coinHeight);
        }

        // Collision detection — collect coin
        // Note: coin.x/y is the center, so we use radius for the bounds
        if (
            playerx < coin.x + coinRadius &&
            playerx + playerWidth > coin.x - coinRadius &&
            playery < coin.y + coinRadius &&
            playery + playerHeight > coin.y - coinRadius
        ) {
            coinCount++;
            document.getElementById('coinsVal').textContent = coinCount;
            // Respawn coin
            coin.x = canvas.width + Math.random() * 300;
            coin.y = Math.random() * (canvas.height - coinHeight);
        }
    });
}

function update() {
    // Smooth Player Movement
    if (keys['w'] || keys['ArrowUp']) {
        playery = Math.max(0, playery - playerSpeed);
    }
    if (keys['s'] || keys['ArrowDown']) {
        playery = Math.min(canvas.height - playerHeight, playery + playerSpeed);
    }
    if (keys['a'] || keys['ArrowLeft']) {
        playerx = Math.max(0, playerx - playerSpeed);
    }
    if (keys['d'] || keys['ArrowRight']) {
        playerx = Math.min(canvas.width - playerWidth, playerx + playerSpeed);
    }

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
            !isInvincible &&
            playerx < enemy.x + enemyWidth &&
            playerx + playerWidth > enemy.x &&
            playery < enemy.y + enemyHeight &&
            playery + playerHeight > enemy.y
        ) {
            if (shieldCount > 0) {
                shieldCount--;
                if (shieldCount <= 0) {
                    document.getElementById('shieldStatus').style.display = 'none';
                } else {
                    document.getElementById('shieldStatus').textContent = `🛡️ Shield Active x${shieldCount}`;
                }
                
                // Temporary invincibility so gravity/physics stay smooth
                isInvincible = true;
                setTimeout(() => { isInvincible = false; }, 1000);

                // Move enemy away
                enemy.x = -enemyWidth; 
            } else {
                gameOver();
            }
        }
    });

    // Boss Logic
    if (bossActive) {
        updateBoss();
    }
}

function updateBoss() {
    let b = bossList[currentBossIndex];

    // Difficulty and move sets based on current boss
    let fireInterval = 2000;
    
    // Movement modifications
    if (currentBossIndex === 0) {
        // POGSHIT LORD: Slowest, standard sine wave
        bossY = (canvas.height / 2 - 50) + Math.sin(Date.now() / 500) * 100;
        fireInterval = 1500;
    } else if (currentBossIndex === 1) {
        // TASGA BOY: Faster sine wave with larger amplitude
        bossY = (canvas.height / 2 - 50) + Math.sin(Date.now() / 300) * 150;
        fireInterval = 1000; // shoots much faster
    } else if (currentBossIndex === 2) {
        // KOREAN BOY: Erratic and fast movement
        bossY = (canvas.height / 2 - 50) + Math.sin(Date.now() / 200) * 200 + Math.cos(Date.now() / 350) * 80;
        fireInterval = 700; // fastest shooter
    }
    
    // Limit boss Y to canvas boundaries to avoid going off-screen
    bossY = Math.max(0, Math.min(canvas.height - 100, bossY));

    // Track how long the boss has been here (running at 60fps)
    bossDuration++;
    if (bossDuration >= 2400) { // 40 seconds duration
        bossActive = false;
        bossDuration = 0;
        bossProjectiles = [];
        survivalAlertTimer = 180;
        
        // Cycle to the next boss in the pool
        currentBossIndex = (currentBossIndex + 1) % bossList.length;
        return;
    }

    // Boss Shooting Logic
    if (!b.lastShot) b.lastShot = 0;
    if (Date.now() - b.lastShot > fireInterval) {
        b.lastShot = Date.now();
        
        if (currentBossIndex === 0) {
            // POGSHIT LORD: Single fast projectile
            bossProjectiles.push({
                x: canvas.width - 150,
                y: bossY + 50,
                vx: -12,
                vy: 0
            });
        } else if (currentBossIndex === 1) {
            // TASGA BOY: 3-way spread shot
            bossProjectiles.push({ x: canvas.width - 150, y: bossY + 50, vx: -10, vy: -3 });
            bossProjectiles.push({ x: canvas.width - 150, y: bossY + 50, vx: -12, vy: 0 });
            bossProjectiles.push({ x: canvas.width - 150, y: bossY + 50, vx: -10, vy: 3 });
        } else if (currentBossIndex === 2) {
            // KOREAN BOY: 5-way spread + targeting player occasionally
            bossProjectiles.push({ x: canvas.width - 150, y: bossY + 50, vx: -13, vy: -4 });
            bossProjectiles.push({ x: canvas.width - 150, y: bossY + 50, vx: -14, vy: -2 });
            bossProjectiles.push({ x: canvas.width - 150, y: bossY + 50, vx: -18, vy: 0 });
            bossProjectiles.push({ x: canvas.width - 150, y: bossY + 50, vx: -14, vy: 2 });
            bossProjectiles.push({ x: canvas.width - 150, y: bossY + 50, vx: -13, vy: 4 });
            
            // Targeted projectile towards player
            if (Math.random() < 0.6) {
                let dx = (playerx + playerWidth/2) - (canvas.width - 150);
                let dy = (playery + playerHeight/2) - (bossY + 50);
                let dist = Math.sqrt(dx*dx + dy*dy);
                let tx = (dx / dist) * 14;
                let ty = (dy / dist) * 14;
                bossProjectiles.push({ x: canvas.width - 150, y: bossY + 50, vx: tx, vy: ty });
            }
        }
    }

    // Update Projectiles
    for (let index = bossProjectiles.length - 1; index >= 0; index--) {
        let p = bossProjectiles[index];
        // Fallback for older style projectiles
        if (p.vx === undefined) { p.vx = -p.speed; p.vy = 0; }
        
        p.x += p.vx;
        p.y += p.vy;
        
        // Collision with player
        if (!isInvincible && 
            playerx < p.x + 20 && playerx + playerWidth > p.x &&
            playery < p.y + 20 && playery + playerHeight > p.y) {
            
            if (shieldCount > 0) {
                shieldCount--;
                isInvincible = true;
                setTimeout(() => { isInvincible = false; }, 1000);
                bossProjectiles.splice(index, 1);
                if (shieldCount <= 0) document.getElementById('shieldStatus').style.display = 'none';
                else document.getElementById('shieldStatus').textContent = `🛡️ Shield Active x${shieldCount}`;
            } else {
                gameOver();
            }
            continue; // Skip the bounds check if it hit the player
        }

        // Clean up out of bounds
        if (p.x < -50 || p.y < -50 || p.y > canvas.height + 50) {
            bossProjectiles.splice(index, 1);
        }
    }
}

function drawBoss() {
    if (!bossActive) return;

    let b = bossList[currentBossIndex];

    // Draw Boss Image
    ctx.drawImage(bossImages[currentBossIndex], canvas.width - 150, bossY, 100, 100);
    
    ctx.fillStyle = "white";
    ctx.font = "20px Arial";
    ctx.fillText(b.name, canvas.width - 130, bossY + 120); 

    // Projectiles
    ctx.fillStyle = b.color;
    bossProjectiles.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 10, 0, Math.PI * 2);
        ctx.fill();
    });

    // Warning Message
    if (bossAlertTimer > 0) {
        let b = bossList[currentBossIndex];
        ctx.fillStyle = "red";
        ctx.font = "bold 40px Arial";
        ctx.textAlign = "center";
        ctx.fillText(`⚠️ ${b.name} DETECTED ⚠️`, canvas.width / 2, canvas.height / 2);
        ctx.textAlign = "start"; // reset
        bossAlertTimer--;
    }

    // Survival Message
    if (survivalAlertTimer > 0) {
        ctx.fillStyle = "lime";
        ctx.font = "bold 25px Arial";
        ctx.textAlign = "center";
        ctx.fillText("You have survived the boss, but he will comeback again!!!", canvas.width / 2, canvas.height / 2);
        ctx.textAlign = "start"; 
        survivalAlertTimer--;
    }
}

function spawnBoss() {
    bossActive = true;
    shieldCount = 3;
    bossAlertTimer = 180; 
    
    let b = bossList[currentBossIndex];
    document.getElementById('shieldStatus').style.display = 'block';
    document.getElementById('shieldStatus').textContent = `🛡️ Shield Active x${shieldCount}`;
    
    // Cycle to next boss for next time
    // (Wait, we'll increment after survival so current boss stays consistent)
}

let lastTime = Date.now();
function gameLoop() {
    if (!gameRunning || isPaused || isGameOver) return;
    update();
    updateCoins();

    // Track Time and Spawn Boss
    let now = Date.now();
    if (now - lastTime >= 1000) {
        gameTime++;
        lastTime = now;
        
        // Update Timer Display
        let minutes = Math.floor(gameTime / 60);
        let seconds = gameTime % 60;
        document.getElementById('timeVal').textContent = 
            `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

        if (gameTime > 0 && gameTime % 120 === 0) {
            spawnBoss();
        }
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawPlayer();
    drawEnemies();
    drawCoins();
    drawBoss();
    requestAnimationFrame(gameLoop);
}

// Hide all menus except the start menu
function initUI() {
    document.getElementById('startMenu').style.display = 'flex';
    document.getElementById('pauseMenu').style.display = 'none';
    document.getElementById('gameOverMenu').style.display = 'none';
    document.getElementById('CoinsMenu').style.display = 'none';
}

function startGame() {
    document.getElementById('startMenu').style.display = 'none';
    coinCount = 0;
    // Reset the HUD display to 0 for the new session
    document.getElementById('coinsVal').textContent = 0; 
    
    // Boss Reset
    bossActive = false;
    bossProjectiles = [];
    gameTime = 0;
    lastTime = Date.now();

    // Show shield icon if player has one
    if (shieldCount > 0) {
        document.getElementById('shieldStatus').style.display = 'block';
        document.getElementById('shieldStatus').textContent = `🛡️ Shield Active x${shieldCount}`;
    } else {
        document.getElementById('shieldStatus').style.display = 'none';
    }

    spawnEnemies();
    spawnCoins();
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
    document.getElementById('finalCoinsVal').textContent = coinCount;
    document.getElementById('gameOverMenu').style.display = 'flex';

    // Update the Store total count instantly in the UI
    const storeCountEl = document.getElementById('storeCoinsVal');
    if (storeCountEl) {
        const currentTotal = parseInt(storeCountEl.textContent) || 0;
        storeCountEl.textContent = currentTotal + coinCount;
    }

    // Save score to SQLite
    const csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute('content');
    
    fetch('/save-score', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN': csrfToken
        },
        body: JSON.stringify({ coins: coinCount })
    })
    .then(response => response.json())
    .then(data => console.log('Score saved:', data))
    .catch(error => console.error('Error saving score:', error));
}

function restartGame() {
    document.getElementById('gameOverMenu').style.display = 'none';
    document.getElementById('CoinsMenu').style.display = 'none';
    playerx = 50;
    playery = 300;
    coinCount = 0;
    document.getElementById('coinsVal').textContent = 0;
    spawnEnemies();
    spawnCoins();
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

function showCoinsMenu() {
    document.getElementById('CoinsMenu').style.display = 'flex';
    document.getElementById('CoinsVal').textContent = coinCount;
}

function hideCoinsMenu() {
    document.getElementById('CoinsMenu').style.display = 'none';
}

function showStoreMenu() {
    document.getElementById('storeMenu').style.display = 'flex';
}

function hideStoreMenu() {
    document.getElementById('storeMenu').style.display = 'none';
}

function showPlayerMenu() {
    document.getElementById('playerMenu').style.display = 'flex';
}

function hidePlayerMenu() {
    document.getElementById('playerMenu').style.display = 'none';
}

// Event Listeners
document.getElementById('playerMenuButton').addEventListener('click', showPlayerMenu);
document.getElementById('closePlayerMenuButton').addEventListener('click', hidePlayerMenu);
document.getElementById('storeButton').addEventListener('click', showStoreMenu);
document.getElementById('closeStoreButton').addEventListener('click', hideStoreMenu);

// Store Tab Switching
const skinsTab = document.getElementById('skinsTab');
const powerupsTab = document.getElementById('powerupsTab');
const skinsSection = document.getElementById('skinsSection');
const powerupsSection = document.getElementById('powerupsSection');

skinsTab.addEventListener('click', () => {
    skinsSection.style.display = 'grid';
    powerupsSection.style.display = 'none';
    skinsTab.style.backgroundColor = '#290c9a';
    powerupsTab.style.backgroundColor = '#444';
});

powerupsTab.addEventListener('click', () => {
    skinsSection.style.display = 'none';
    powerupsSection.style.display = 'grid';
    powerupsTab.style.backgroundColor = '#290c9a';
    skinsTab.style.backgroundColor = '#444';
});

function buyItem(button) {
    const type = button.getAttribute('data-type');
    const price = parseInt(button.getAttribute('data-price'));
    const name = button.getAttribute('data-name');
    const value = button.getAttribute('data-color'); // for skins
    const csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute('content');

    const balanceEl = document.getElementById('storeCoinsVal');
    const currentBalance = parseInt(balanceEl.textContent);

    if (currentBalance < price) {
        alert("insufficient funds!");
        return;
    }

    fetch('/buy-skin', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN': csrfToken
        },
        body: JSON.stringify({ 
            price: price,
            name: name,
            type: type,
            value: value
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            const newBalance = currentBalance - price;
            balanceEl.textContent = newBalance;
            
            // Also update the HUD balance so they match
            const hudBalanceEl = document.getElementById('coinsVal');
            if (hudBalanceEl && !gameRunning) {
                hudBalanceEl.textContent = newBalance;
            }
            
            if (type === 'skin') {
                playerColor = value;
                alert(`You bought the ${name}! Your ship is now this color.`);
            } else if (type === 'upgrade') {
                const item = button.getAttribute('data-item');
                if (item === 'shield') {
                    shieldCount = 1;
                    document.getElementById('shieldStatus').style.display = 'block';
                    document.getElementById('shieldStatus').textContent = `🛡️ Shield Active x${shieldCount}`;
                    alert("Shield Activated!");
                }
            }
            // Refresh to show in player menu
            location.reload(); 
        } else {
            alert(data.message);
        }
    })
    .catch(error => console.error('Error:', error));
}

// Player Menu Logic
document.querySelectorAll('.equip-button').forEach(button => {
    button.addEventListener('click', () => {
        playerColor = button.getAttribute('data-color');
        alert("Ship Color Equipped!");
        hidePlayerMenu();
    });
});

document.querySelectorAll('.activate-button').forEach(button => {
    button.addEventListener('click', () => {
        const itemName = button.getAttribute('data-item');
        if (itemName === 'Energy Shield') {
            shieldCount = 1;
            document.getElementById('shieldStatus').style.display = 'block';
            document.getElementById('shieldStatus').textContent = `🛡️ Shield Active x${shieldCount}`;
            alert("Shield Activated for the next run!");
        } else {
            alert(itemName + " is now active!");
        }
        hidePlayerMenu();
    });
});

document.querySelectorAll('.buy-button').forEach(button => {
    button.addEventListener('click', () => buyItem(button));
});

document.addEventListener('keydown', (e) => {
    keys[e.key] = true;

    // Pause toggle still handles once per press
    if ((e.key === 'p' || e.key === 'P') && gameRunning && !isGameOver) {
        if (isPaused) {
            resumeGame();
        } else {
            pauseGame();
        }
    }
});

document.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

document.getElementById('startButton').addEventListener('click', startGame);

const resumeButton = document.getElementById('resumeButton');
if (resumeButton) {
    resumeButton.addEventListener('click', resumeGame);
}

const gameOverRestartButton = document.getElementById('gameOverRestartButton');
if (gameOverRestartButton) {
    gameOverRestartButton.addEventListener('click', restartGame);
}

const gameOverQuitButton = document.getElementById('gameOverQuitButton');
if (gameOverQuitButton) {
    gameOverQuitButton.addEventListener('click', quitGame);
}

const pauseQuitButton = document.getElementById('pauseQuitButton');
if (pauseQuitButton) {
    pauseQuitButton.addEventListener('click', quitGame);
}

const coinsRestartButton = document.getElementById('CoinsRestartButton');
if (coinsRestartButton) {
    coinsRestartButton.addEventListener('click', restartGame);
}

const coinsQuitButton = document.getElementById('CoinsQuitButton');
if (coinsQuitButton) {
    coinsQuitButton.addEventListener('click', quitGame);
}

// Initialize UI on load
initUI();

