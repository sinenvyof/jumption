// =====================
// CONSTANTS
// =====================
const SCREEN_WIDTH = 800;
const SCREEN_HEIGHT = 300;
const GROUND_HEIGHT = 250;
const FPS = 60;

// Physics
const GRAVITY = 1;
const JUMP_HEIGHT = 15;

// Difficulty
const NORMAL_SPEED = 25, NORMAL_INCREASE = 0.3;
const FAST_SPEED = 50, FAST_INCREASE = 0.25;
const ULTRA_FAST_SPEED = 100, ULTRA_FAST_INCREASE = 0.7;

// Themes
const LIGHT_BG = '#ffffff';
const LIGHT_FG = '#000000';
const DARK_BG = '#1e1e1e';
const DARK_FG = '#dcdcdc';

// =====================
// CANVAS SETUP
// =====================
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// =====================
// SAVE / LOAD SETTINGS
// =====================
function loadSettings() {
    const darkMode = localStorage.getItem('dark_mode');
    return { dark_mode: darkMode === 'true' };
}

function saveSettings(settings) {
    localStorage.setItem('dark_mode', settings.dark_mode);
}

let settings = loadSettings();
let darkMode = settings.dark_mode;

// =====================
// THEME UPDATE
// =====================
function updateTheme() {
    document.body.style.backgroundColor = darkMode ? DARK_BG : LIGHT_BG;
    canvas.style.borderColor = darkMode ? DARK_FG : LIGHT_FG;
    document.getElementById('instructions').style.color = darkMode ? DARK_FG : LIGHT_FG;
}

updateTheme(); // Initial theme set

// =====================
// GAME STATE
// =====================
let gameState = 'start'; // 'start', 'playing', 'gameOver'
let speed, speedInc;
let rectangle;
let cacti = [];
let score = 0;
let timer = 0;
let lastTime = 0;

// =====================
// CLASSES
// =====================
class Rectangle {
    constructor() {
        this.x = 50;
        this.y = GROUND_HEIGHT - 40;
        this.width = 40;
        this.height = 40;
        this.velY = 0;
        this.isJumping = false;
    }

    jump() {
        if (!this.isJumping) {
            this.velY = -JUMP_HEIGHT;
            this.isJumping = true;
        }
    }

    update() {
        this.velY += GRAVITY;
        this.y += this.velY;
        if (this.y >= GROUND_HEIGHT - this.height) {
            this.y = GROUND_HEIGHT - this.height;
            this.isJumping = false;
            this.velY = 0;
        }
    }

    draw(color) {
        ctx.fillStyle = color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }
}

class Cactus {
    constructor(x, speed) {
        this.x = x;
        this.y = GROUND_HEIGHT - 30;
        this.width = 20;
        this.height = 30;
        this.speed = speed;
    }

    update() {
        this.x -= this.speed;
    }

    draw(color) {
        ctx.fillStyle = color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }

    offScreen() {
        return this.x < -this.width;
    }
}

// =====================
// FADE ANIMATION
// =====================
function fade(bgColor) {
    return new Promise(resolve => {
        const fadeSurface = document.createElement('canvas');
        fadeSurface.width = SCREEN_WIDTH;
        fadeSurface.height = SCREEN_HEIGHT;
        const fadeCtx = fadeSurface.getContext('2d');
        fadeCtx.fillStyle = bgColor;
        fadeCtx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

        let alpha = 0;
        const fadeInterval = setInterval(() => {
            alpha += 15;
            if (alpha >= 255) {
                clearInterval(fadeInterval);
                resolve();
                return;
            }
            fadeCtx.globalAlpha = alpha / 255;
            ctx.drawImage(fadeSurface, 0, 0);
        }, 10);
    });
}

// =====================
// START MENU
// =====================
function startScreen() {
    const bg = darkMode ? DARK_BG : LIGHT_BG;
    const fg = darkMode ? DARK_FG : LIGHT_FG;

    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

    ctx.fillStyle = fg;
    ctx.font = '28px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Select Difficulty', SCREEN_WIDTH / 2, 60);

    const options = [
        '1 - Normal',
        '2 - Fast',
        '3 - Ultra Fast',
        'D - Toggle Dark Mode',
        'ESC - Quit'
    ];

    for (let i = 0; i < options.length; i++) {
        ctx.fillText(options[i], SCREEN_WIDTH / 2, 120 + i * 35);
    }

    // Dark mode indicator
    const indicator = darkMode ? '🌙 Dark Mode ON' : '☀ Light Mode';
    ctx.textAlign = 'left';
    ctx.fillText(indicator, 10, 30);
}

// =====================
// MAIN GAME LOOP
// =====================
function update(deltaTime) {
    if (gameState === 'playing') {
        rectangle.update();
        timer += deltaTime;

        if (timer > Math.random() * 50 + 50) { // random between 50-100
            cacti.push(new Cactus(SCREEN_WIDTH, speed));
            timer = 0;
        }

        cacti.forEach(cactus => {
            cactus.update();
            if (cactus.offScreen()) {
                cacti.splice(cacti.indexOf(cactus), 1);
                score++;
            }
            if (
                rectangle.x + rectangle.width > cactus.x &&
                rectangle.x < cactus.x + cactus.width &&
                rectangle.y + rectangle.height > cactus.y
            ) {
                gameState = 'gameOver';
            }
        });

        speed += speedInc / FPS;
        cacti.forEach(c => c.speed = speed);
    }
}

function draw() {
    const bg = darkMode ? DARK_BG : LIGHT_BG;
    const fg = darkMode ? DARK_FG : LIGHT_FG;

    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

    ctx.strokeStyle = fg;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, GROUND_HEIGHT);
    ctx.lineTo(SCREEN_WIDTH, GROUND_HEIGHT);
    ctx.stroke();

    if (gameState === 'start') {
        startScreen();
    } else if (gameState === 'playing' || gameState === 'gameOver') {
        rectangle.draw(fg);
        cacti.forEach(cactus => cactus.draw(fg));

        ctx.fillStyle = fg;
        ctx.font = '20px Arial';
        ctx.textAlign = 'right';
        ctx.fillText(`Score: ${score}`, SCREEN_WIDTH - 10, 30);
        ctx.textAlign = 'left';
        ctx.fillText('D = Toggle Dark Mode', 10, SCREEN_HEIGHT - 10);

        if (gameState === 'gameOver') {
            ctx.textAlign = 'center';
            ctx.fillText('Game Over! Press R to Restart', SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2);
        }
    }
}

function gameLoop(currentTime) {
    const deltaTime = (currentTime - lastTime) / (1000 / FPS);
    lastTime = currentTime;

    update(deltaTime);
    draw();

    requestAnimationFrame(gameLoop);
}

// =====================
// EVENT LISTENERS
// =====================
document.addEventListener('keydown', (event) => {
    if (gameState === 'start') {
        if (event.key === '1') {
            speed = NORMAL_SPEED;
            speedInc = NORMAL_INCREASE;
            gameState = 'playing';
            rectangle = new Rectangle();
            cacti = [];
            score = 0;
            timer = 0;
        } else if (event.key === '2') {
            speed = FAST_SPEED;
            speedInc = FAST_INCREASE;
            gameState = 'playing';
            rectangle = new Rectangle();
            cacti = [];
            score = 0;
            timer = 0;
        } else if (event.key === '3') {
            speed = ULTRA_FAST_SPEED;
            speedInc = ULTRA_FAST_INCREASE;
            gameState = 'playing';
            rectangle = new Rectangle();
            cacti = [];
            score = 0;
            timer = 0;
        } else if (event.key === 'd') {
            darkMode = !darkMode;
            settings.dark_mode = darkMode;
            saveSettings(settings);
            updateTheme();
        } else if (event.key === 'Escape') {
            // Quit - in browser, maybe do nothing or close tab
        }
    } else if (gameState === 'playing') {
        if (event.key === ' ' || event.key === 'ArrowUp') {
            rectangle.jump();
        } else if (event.key === 'd') {
            darkMode = !darkMode;
            settings.dark_mode = darkMode;
            saveSettings(settings);
            updateTheme();
        }
    } else if (gameState === 'gameOver') {
        if (event.key === 'r') {
            gameState = 'start';
        }
    }
});

// =====================
// START GAME
// =====================
requestAnimationFrame(gameLoop);
