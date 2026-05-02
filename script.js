const canvas = document.getElementById('game-canvas');       
const ctx = canvas.getContext('2d');                          
const scoreDisplay = document.getElementById('score');        
const highScoreDisplay = document.getElementById('high-score'); 
const gameOverScreen = document.getElementById('game-over');  
const startScreen = document.getElementById('start-screen');  
const finalScoreDisplay = document.getElementById('final-score'); 
const restartBtn = document.getElementById('restart-btn');    
const startBtn = document.getElementById('start-btn');        
const btnUp = document.getElementById('btn-up');
const btnDown = document.getElementById('btn-down');
const btnLeft = document.getElementById('btn-left');
const btnRight = document.getElementById('btn-right');
const GRID_SIZE = 20;        
const TILE_COUNT = 20;       
const GAME_SPEED = 100;      
const SNAKE_COLOR = '#00ff88';      
const SNAKE_GLOW = '#00ff88';       
const FOOD_COLOR = '#ff3366';       
const FOOD_GLOW = '#ff3366';        
const BACKGROUND_COLOR = '#0a0a0a'; 
let snake = [];              
let food = { x: 0, y: 0 };   
let direction = { x: 0, y: 0 }; 
let nextDirection = { x: 0, y: 0 }; 
let score = 0;               
let highScore = 0;           
let gameRunning = false;     
let gameLoop = null;         
let foodPulse = 0;           
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playEatSound() {
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();  
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    oscillator.frequency.value = 600;   
    oscillator.type = 'sine';           
    gainNode.gain.value = 0.1;          
    oscillator.start();
    setTimeout(() => oscillator.stop(), 100);
}
function playGameOverSound() {
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    oscillator.frequency.value = 200;   
    oscillator.type = 'sawtooth';       
    gainNode.gain.value = 0.15;
    oscillator.start();
    oscillator.frequency.exponentialRampToValueAtTime(50, audioCtx.currentTime + 0.5);
    setTimeout(() => oscillator.stop(), 500);
}
function init() {
    const savedHighScore = localStorage.getItem('snakeHighScore');
    if (savedHighScore) {
        highScore = parseInt(savedHighScore);
        highScoreDisplay.textContent = highScore;
    }
    restartBtn.addEventListener('click', startGame);
    startBtn.addEventListener('click', startGame);
    btnUp.addEventListener('click', () => setDirection(0, -1));
    btnDown.addEventListener('click', () => setDirection(0, 1));
    btnLeft.addEventListener('click', () => setDirection(-1, 0));
    btnRight.addEventListener('click', () => setDirection(1, 0));
    document.addEventListener('keydown', handleKeyPress);
    draw();
}
function startGame() {
    gameOverScreen.classList.add('hidden');
    startScreen.classList.add('hidden');
    snake = [
        { x: 10, y: 10 },  
        { x: 9, y: 10 },   
        { x: 8, y: 10 }    
    ];
    direction = { x: 1, y: 0 };
    nextDirection = { x: 1, y: 0 };
    score = 0;
    scoreDisplay.textContent = score;
    placeFood();
    gameRunning = true;
    if (gameLoop) clearInterval(gameLoop);
    gameLoop = setInterval(update, GAME_SPEED);
}
function placeFood() {
    let validPosition = false;
    while (!validPosition) {
        food.x = Math.floor(Math.random() * TILE_COUNT);
        food.y = Math.floor(Math.random() * TILE_COUNT);
        validPosition = true; 
        for (let segment of snake) {
            if (segment.x === food.x && segment.y === food.y) {
                validPosition = false;
                break; 
            }
        }
    }
}
function handleKeyPress(event) {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
        event.preventDefault();
    }
    if (!gameRunning) return;
    switch (event.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
            setDirection(0, -1);
            break;
        case 'ArrowDown':
        case 's':
        case 'S':
            setDirection(0, 1);
            break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
            setDirection(-1, 0);
            break;
        case 'ArrowRight':
        case 'd':
        case 'D':
            setDirection(1, 0);
            break;
    }
}
function setDirection(x, y) {
    if (direction.x !== -x && direction.y !== -y) {
        nextDirection = { x, y };
    }
}
function update() {
    direction = nextDirection;
    const head = {
        x: snake[0].x + direction.x,
        y: snake[0].y + direction.y
    };
    if (head.x < 0 || head.x >= TILE_COUNT || head.y < 0 || head.y >= TILE_COUNT) {
        gameOver();
        return;
    }
    for (let segment of snake) {
        if (head.x === segment.x && head.y === segment.y) {
            gameOver();
            return;
        }
    }
    snake.unshift(head);
    if (head.x === food.x && head.y === food.y) {
        score += 10;
        scoreDisplay.textContent = score;
        if (score > highScore) {
            highScore = score;
            highScoreDisplay.textContent = highScore;
            localStorage.setItem('snakeHighScore', highScore);
        }
        playEatSound();
        placeFood();
    } else {
        snake.pop();
    }
    foodPulse += 0.1;
    draw();
}
function draw() {
    ctx.fillStyle = BACKGROUND_COLOR;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = 'rgba(0, 255, 136, 0.05)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= TILE_COUNT; i++) {
        ctx.beginPath();
        ctx.moveTo(i * GRID_SIZE, 0);
        ctx.lineTo(i * GRID_SIZE, canvas.height);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, i * GRID_SIZE);
        ctx.lineTo(canvas.width, i * GRID_SIZE);
        ctx.stroke();
    }
    const pulseSize = Math.sin(foodPulse) * 2; 
    ctx.shadowColor = FOOD_GLOW;
    ctx.shadowBlur = 15 + pulseSize;
    ctx.fillStyle = FOOD_COLOR;
    const foodPixelX = food.x * GRID_SIZE + 2;
    const foodPixelY = food.y * GRID_SIZE + 2;
    const foodSize = GRID_SIZE - 4;
    roundRect(ctx, foodPixelX, foodPixelY, foodSize, foodSize, 5);
    ctx.fill();
    ctx.shadowBlur = 0;
    for (let i = 0; i < snake.length; i++) {
        const segment = snake[i];
        if (i === 0) {
            ctx.shadowColor = SNAKE_GLOW;
            ctx.shadowBlur = 20;
            ctx.fillStyle = '#ffffff'; 
        } else {
            ctx.shadowColor = SNAKE_GLOW;
            ctx.shadowBlur = 10;
            const fade = 1 - (i / snake.length) * 0.5;
            ctx.fillStyle = `rgba(0, 255, 136, ${fade})`;
        }
        const segX = segment.x * GRID_SIZE + 1;
        const segY = segment.y * GRID_SIZE + 1;
        const segSize = GRID_SIZE - 2;
        roundRect(ctx, segX, segY, segSize, segSize, 4);
        ctx.fill();
        if (i === 0) {
            ctx.shadowBlur = 0;
            ctx.fillStyle = '#0a0a0a';
            let eye1X, eye1Y, eye2X, eye2Y;
            const eyeOffset = 4;
            const eyeSize = 3;
            if (direction.x === 1) { 
                eye1X = segX + 12; eye1Y = segY + 4;
                eye2X = segX + 12; eye2Y = segY + 12;
            } else if (direction.x === -1) { 
                eye1X = segX + 4; eye1Y = segY + 4;
                eye2X = segX + 4; eye2Y = segY + 12;
            } else if (direction.y === -1) { 
                eye1X = segX + 4; eye1Y = segY + 4;
                eye2X = segX + 12; eye2Y = segY + 4;
            } else { 
                eye1X = segX + 4; eye1Y = segY + 12;
                eye2X = segX + 12; eye2Y = segY + 12;
            }
            ctx.beginPath();
            ctx.arc(eye1X, eye1Y, eyeSize, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(eye2X, eye2Y, eyeSize, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    ctx.shadowBlur = 0;
}
function roundRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
}
function gameOver() {
    gameRunning = false;
    clearInterval(gameLoop);
    playGameOverSound();
    finalScoreDisplay.textContent = score;
    gameOverScreen.classList.remove('hidden');
}
init();
