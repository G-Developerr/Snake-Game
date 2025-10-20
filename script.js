const particleCanvas = document.getElementById("particles");
const pctx = particleCanvas.getContext("2d");
particleCanvas.width = window.innerWidth;
particleCanvas.height = window.innerHeight;

const particles = [];
for (let i = 0; i < 100; i++) {
    particles.push({
        x: Math.random() * particleCanvas.width,
        y: Math.random() * particleCanvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        size: Math.random() * 2 + 1,
    });
}

function animateParticles() {
    pctx.fillStyle = "rgba(15, 12, 41, 0.1)";
    pctx.fillRect(0, 0, particleCanvas.width, particleCanvas.height);

    particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > particleCanvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > particleCanvas.height) p.vy *= -1;

        pctx.fillStyle = "rgba(0, 242, 96, 0.5)";
        pctx.beginPath();
        pctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        pctx.fill();
    });

    requestAnimationFrame(animateParticles);
}
animateParticles();

// Game logic
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const scoreElement = document.getElementById("score");
const highScoreElement = document.getElementById("highScore");
const gameOverElement = document.getElementById("gameOver");
const finalScoreElement = document.getElementById("finalScore");

const gridSize = 30;
const tileCount = canvas.width / gridSize;

let snake = [{ x: 10, y: 10 }];
let food = { x: 15, y: 15 };
let dx = 0;
let dy = 0;
let score = 0;
let highScore = localStorage.getItem("snake3DHighScore") || 0;
let gameRunning = true;
let gameSpeed = 120;

highScoreElement.textContent = highScore;

document.addEventListener("keydown", changeDirection);

function changeDirection(e) {
    const key = e.key.toLowerCase();

    if ((key === "arrowleft" || key === "a") && dx === 0) {
        dx = -1;
        dy = 0;
    } else if ((key === "arrowup" || key === "w") && dy === 0) {
        dx = 0;
        dy = -1;
    } else if ((key === "arrowright" || key === "d") && dx === 0) {
        dx = 1;
        dy = 0;
    } else if ((key === "arrowdown" || key === "s") && dy === 0) {
        dx = 0;
        dy = 1;
    }
}

function drawGame() {
    if (!gameRunning) return;
    clearCanvas();
    moveSnake();
    drawSnake();
    drawFood();
    checkCollision();
    setTimeout(drawGame, gameSpeed);
}

function clearCanvas() {
    const gradient = ctx.createRadialGradient(
        canvas.width / 2,
        canvas.height / 2,
        0,
        canvas.width / 2,
        canvas.height / 2,
        canvas.width / 2
    );
    gradient.addColorStop(0, "#1a1a2e");
    gradient.addColorStop(1, "#0a0a15");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = "rgba(0, 242, 96, 0.1)";
    ctx.lineWidth = 1;
    for (let i = 0; i <= tileCount; i++) {
        ctx.beginPath();
        ctx.moveTo(i * gridSize, 0);
        ctx.lineTo(i * gridSize, canvas.height);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(0, i * gridSize);
        ctx.lineTo(canvas.width, i * gridSize);
        ctx.stroke();
    }
}

function moveSnake() {
    if (dx === 0 && dy === 0) return;

    const head = { x: snake[0].x + dx, y: snake[0].y + dy };
    snake.unshift(head);

    if (head.x === food.x && head.y === food.y) {
        score++;
        scoreElement.textContent = score;
        generateFood();

        if (score > highScore) {
            highScore = score;
            highScoreElement.textContent = highScore;
            localStorage.setItem("snake3DHighScore", highScore);
        }
    } else {
        snake.pop();
    }
}

function drawSnake() {
    snake.forEach((segment, index) => {
        const x = segment.x * gridSize;
        const y = segment.y * gridSize;
        const size = gridSize - 4;
        const colorIntensity = 1 - (index / snake.length) * 0.3;

        ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
        ctx.fillRect(x + 3, y + 3, size, size);

        const gradient = ctx.createLinearGradient(x, y, x + size, y + size);
        if (index === 0) {
            gradient.addColorStop(0, `rgba(0, 242, 96, ${colorIntensity})`);
            gradient.addColorStop(1, `rgba(5, 117, 230, ${colorIntensity})`);
        } else {
            gradient.addColorStop(0, `rgba(0, 200, 80, ${colorIntensity})`);
            gradient.addColorStop(1, `rgba(5, 100, 200, ${colorIntensity})`);
        }
        ctx.fillStyle = gradient;
        ctx.fillRect(x, y, size, size);

        ctx.fillStyle = `rgba(255, 255, 255, ${0.3 * colorIntensity})`;
        ctx.fillRect(x, y, size, 2);
        ctx.fillRect(x, y, 2, size);

        ctx.fillStyle = `rgba(0, 0, 0, ${0.4 * colorIntensity})`;
        ctx.fillRect(x, y + size - 2, size, 2);
        ctx.fillRect(x + size - 2, y, 2, size);

        if (index === 0) {
            const eyeSize = 6;
            const eyeOffset = 8;

            // Eye whites
            ctx.fillStyle = "white";
            ctx.beginPath();
            ctx.arc(x + eyeOffset, y + eyeOffset, eyeSize, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(x + size - eyeOffset, y + eyeOffset, eyeSize, 0, Math.PI * 2);
            ctx.fill();

            // Pupils
            ctx.fillStyle = "#000";
            const pupilOffsetX = dx * 2;
            const pupilOffsetY = dy * 2;
            ctx.beginPath();
            ctx.arc(x + eyeOffset + pupilOffsetX, y + eyeOffset + pupilOffsetY, 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(x + size - eyeOffset + pupilOffsetX, y + eyeOffset + pupilOffsetY, 3, 0, Math.PI * 2);
            ctx.fill();

            // Glow
            ctx.shadowColor = "#00f260";
            ctx.shadowBlur = 20;
            ctx.strokeStyle = "#00f260";
            ctx.lineWidth = 2;
            ctx.strokeRect(x, y, size, size);
            ctx.shadowBlur = 0;
        }

        if (index > 0 && index % 2 === 0) {
            ctx.fillStyle = `rgba(255, 255, 255, ${0.1 * colorIntensity})`;
            ctx.fillRect(x + size / 4, y + size / 4, size / 2, size / 2);
        }
    });
}

function drawFood() {
    const x = food.x * gridSize;
    const y = food.y * gridSize;
    const size = gridSize - 4;
    const centerX = x + size / 2;
    const centerY = y + size / 2;
    const pulse = Math.sin(Date.now() / 200) * 0.3 + 0.7;

    const glowGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, size);
    glowGradient.addColorStop(0, `rgba(255, 50, 50, ${0.6 * pulse})`);
    glowGradient.addColorStop(1, "rgba(255, 50, 50, 0)");
    ctx.fillStyle = glowGradient;
    ctx.fillRect(x - 10, y - 10, size + 20, size + 20);

    const appleGradient = ctx.createRadialGradient(
        centerX - 5,
        centerY - 5,
        0,
        centerX,
        centerY,
        size / 2
    );
    appleGradient.addColorStop(0, "#ff6b6b");
    appleGradient.addColorStop(1, "#ee5a52");
    ctx.fillStyle = appleGradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, size / 2, 0, Math.PI * 2);
    ctx.fill();


    ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
    ctx.beginPath();
    ctx.arc(centerX - 4, centerY - 4, size / 6, 0, Math.PI * 2);
    ctx.fill();


    ctx.strokeStyle = "#8b4513";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY - size / 2);
    ctx.lineTo(centerX - 2, centerY - size / 2 - 5);
    ctx.stroke();


    ctx.fillStyle = "#4ecca3";
    ctx.beginPath();
    ctx.ellipse(centerX + 3, centerY - size / 2 - 3, 4, 2, Math.PI / 4, 0, Math.PI * 2);
    ctx.fill();
}

function generateFood() {
    food.x = Math.floor(Math.random() * tileCount);
    food.y = Math.floor(Math.random() * tileCount);

    for (let segment of snake) {
        if (segment.x === food.x && segment.y === food.y) {
            generateFood();
            return;
        }
    }
}

function checkCollision() {
    const head = snake[0];

    if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount) {
        endGame();
        return;
    }

    for (let i = 1; i < snake.length; i++) {
        if (head.x === snake[i].x && head.y === snake[i].y) {
            endGame();
            return;
        }
    }
}

function endGame() {
    gameRunning = false;
    finalScoreElement.textContent = score;
    gameOverElement.classList.add("show");
}

function restartGame() {
    snake = [{ x: 10, y: 10 }];
    food = { x: 15, y: 15 };
    dx = 0;
    dy = 0;
    score = 0;
    scoreElement.textContent = score;
    gameRunning = true;
    gameOverElement.classList.remove("show");
    drawGame();
}

window.addEventListener("resize", () => {
    particleCanvas.width = window.innerWidth;
    particleCanvas.height = window.innerHeight;
});

drawGame();