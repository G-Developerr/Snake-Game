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
const tutorialScreen = document.getElementById("tutorialScreen");
const pauseScreen = document.getElementById("pauseScreen");

// Mobile elements
const arrowUp = document.getElementById("arrowUp");
const arrowDown = document.getElementById("arrowDown");
const arrowLeft = document.getElementById("arrowLeft");
const arrowRight = document.getElementById("arrowRight");
const pauseBtn = document.getElementById("pauseBtn");
const restartBtn = document.getElementById("restartBtn");

const gridSize = 30;
const tileCount = canvas.width / gridSize;

let snake = [{
    x: 10,
    y: 10,
}, ];
let food = {
    x: 15,
    y: 15,
};
let dx = 0;
let dy = 0;
let score = 0;
let highScore = localStorage.getItem("snakeHighScore") || 0;
let gameRunning = false;
let gameSpeed = 200;
let gamePaused = false;
let isEating = false;
let eatAnimationFrame = 0;
let gameStarted = false;
let lastUpdateTime = 0;

let isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
);

highScoreElement.textContent = highScore;

// Hide tutorial on mobile devices immediately
if (isMobile) {
    tutorialScreen.style.display = "none";
    gameStarted = true;
}

document.addEventListener("keydown", handleKeyPress);

// Mobile event listeners
if (isMobile) {
    setupMobileControls();
}

function setupMobileControls() {
    // Arrow buttons events
    arrowUp.addEventListener("touchstart", (e) => {
        e.preventDefault();
        if (dy === 0) {
            dx = 0;
            dy = -1;
            startGameIfNeeded();
        }
    });

    arrowDown.addEventListener("touchstart", (e) => {
        e.preventDefault();
        if (dy === 0) {
            dx = 0;
            dy = 1;
            startGameIfNeeded();
        }
    });

    arrowLeft.addEventListener("touchstart", (e) => {
        e.preventDefault();
        if (dx === 0) {
            dx = -1;
            dy = 0;
            startGameIfNeeded();
        }
    });

    arrowRight.addEventListener("touchstart", (e) => {
        e.preventDefault();
        if (dx === 0) {
            dx = 1;
            dy = 0;
            startGameIfNeeded();
        }
    });

    // Button events
    pauseBtn.addEventListener("touchstart", (e) => {
        e.preventDefault();
        togglePause();
    });

    restartBtn.addEventListener("touchstart", (e) => {
        e.preventDefault();
        restartGame();
    });
}

function startGameIfNeeded() {
    if (!gameRunning && gameStarted) {
        gameRunning = true;
        lastUpdateTime = performance.now();
        requestAnimationFrame(drawGame);
    }
}

function handleKeyPress(e) {
    const key = e.key.toLowerCase();

    // Αν δεν έχει αρχίσει το παιχνίδι, έλεγχος για έναρξη
    if (!gameStarted) {
        const validKeys = ["arrowleft", "arrowup", "arrowright", "arrowdown", "a", "w", "d", "s"];
        if (validKeys.includes(key)) {
            startGame(e);
        }
        return;
    }

    // Παύση
    if (e.key === "Escape" || e.key === "Esc") {
        togglePause();
        return;
    }

    changeDirection(e);
}

function startGame(e) {
    tutorialScreen.classList.add("hide");
    setTimeout(() => {
        tutorialScreen.style.display = "none";
    }, 500);

    gameStarted = true;
    gameRunning = true;
    changeDirection(e);
    lastUpdateTime = performance.now();
    requestAnimationFrame(drawGame);
}

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

function togglePause() {
    gamePaused = !gamePaused;

    if (gamePaused) {
        pauseScreen.classList.add("show");
    } else {
        pauseScreen.classList.remove("show");
        if (gameRunning) {
            lastUpdateTime = performance.now();
            requestAnimationFrame(drawGame);
        }
    }
}

function drawGame(timestamp) {
    if (!gameRunning || gamePaused) {
        requestAnimationFrame(drawGame);
        return;
    }

    // Χρήση delta time για σταθερή ταχύτητα
    if (!lastUpdateTime) lastUpdateTime = timestamp;
    const deltaTime = timestamp - lastUpdateTime;

    // Ενημέρωση μόνο όταν περάσει ο απαιτούμενος χρόνος
    if (deltaTime > gameSpeed) {
        lastUpdateTime = timestamp - (deltaTime % gameSpeed);

        clearCanvas();
        moveSnake();
        checkCollision();

        // ΠΡΩΤΑ το φαγητό
        drawFood();

        // ΜΕΤΑ το φίδι (για να είναι πάνω από το φαγητό)
        drawSnake();

        if (isEating) {
            eatAnimationFrame++;
            if (eatAnimationFrame > 5) {
                isEating = false;
                eatAnimationFrame = 0;
            }
        }
    }

    // Συνεχίζουμε το game loop
    requestAnimationFrame(drawGame);
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

    const head = {
        x: snake[0].x + dx,
        y: snake[0].y + dy,
    };

    // Wrap-around πριν προσθέσουμε το νέο κεφάλι
    if (head.x < 0) head.x = tileCount - 1;
    else if (head.x >= tileCount) head.x = 0;
    if (head.y < 0) head.y = tileCount - 1;
    else if (head.y >= tileCount) head.y = 0;

    snake.unshift(head);

    if (head.x === food.x && head.y === food.y) {
        score++;
        scoreElement.textContent = score;
        generateFood();
        isEating = true;
        eatAnimationFrame = 0;

        // Ταχύτητα όπως ήταν - αργή στην αρχή και γρήγορη με τους πόντους
        gameSpeed = Math.max(120, 200 - score * 5);

        if (score > highScore) {
            highScore = score;
            highScoreElement.textContent = highScore;
            localStorage.setItem("snakeHighScore", highScore);
        }
    } else {
        snake.pop();
    }
}

function drawSnake() {
    if (snake.length === 0) return;

    // Βρες τα σημεία όπου γίνεται wrap-around
    const wrapPoints = [];
    for (let i = 1; i < snake.length; i++) {
        const prev = snake[i - 1];
        const curr = snake[i];

        // Έλεγχος για οριζόντιο wrap-around
        if (Math.abs(curr.x - prev.x) > 1) {
            wrapPoints.push(i);
        }
        // Έλεγχος για κάθετο wrap-around
        if (Math.abs(curr.y - prev.y) > 1) {
            wrapPoints.push(i);
        }
    }

    // Σχεδίαση του φιδιού σε τμήματα
    let startIndex = 0;

    for (const wrapIndex of[...wrapPoints, snake.length]) {
        // Σχεδίαση του τμήματος από startIndex έως wrapIndex
        if (wrapIndex - startIndex > 1) {
            drawSnakeSegment(startIndex, wrapIndex);
        }
        startIndex = wrapIndex;
    }

    // Σχεδίαση κεφαλιού ξεχωριστά
    drawSnakeHead();
}

function drawSnakeSegment(startIndex, endIndex) {
    ctx.save();

    ctx.beginPath();

    for (let i = startIndex; i < endIndex; i++) {
        const segment = snake[i];
        const x = segment.x * gridSize + gridSize / 2;
        const y = segment.y * gridSize + gridSize / 2;

        if (i === startIndex) {
            ctx.moveTo(x, y);
        } else {
            const prevSegment = snake[i - 1];
            const prevX = prevSegment.x * gridSize + gridSize / 2;
            const prevY = prevSegment.y * gridSize + gridSize / 2;

            const cpX = (prevX + x) / 2;
            const cpY = (prevY + y) / 2;
            ctx.quadraticCurveTo(prevX, prevY, cpX, cpY);
        }
    }

    // Gradient για το τμήμα
    const startSegment = snake[startIndex];
    const endSegment = snake[endIndex - 1];
    const startX = startSegment.x * gridSize + gridSize / 2;
    const startY = startSegment.y * gridSize + gridSize / 2;
    const endX = endSegment.x * gridSize + gridSize / 2;
    const endY = endSegment.y * gridSize + gridSize / 2;

    const bodyGradient = ctx.createLinearGradient(startX, startY, endX, endY);
    bodyGradient.addColorStop(0, startIndex === 0 ? "#00ff80" : "#00cc66");
    bodyGradient.addColorStop(1, "#009944");

    ctx.strokeStyle = bodyGradient;
    ctx.lineWidth = gridSize * 0.8;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();

    // Overlay με φωτεινότητα
    ctx.beginPath();
    for (let i = startIndex; i < endIndex; i++) {
        const segment = snake[i];
        const x = segment.x * gridSize + gridSize / 2;
        const y = segment.y * gridSize + gridSize / 2;

        if (i === startIndex) {
            ctx.moveTo(x, y);
        } else {
            const prevSegment = snake[i - 1];
            const prevX = prevSegment.x * gridSize + gridSize / 2;
            const prevY = prevSegment.y * gridSize + gridSize / 2;
            const cpX = (prevX + x) / 2;
            const cpY = (prevY + y) / 2;
            ctx.quadraticCurveTo(prevX, prevY, cpX, cpY);
        }
    }

    const highlightGradient = ctx.createLinearGradient(
        startX - 10,
        startY - 10,
        startX + 10,
        startY + 10
    );
    highlightGradient.addColorStop(0, "rgba(255, 255, 255, 0.3)");
    highlightGradient.addColorStop(1, "rgba(255, 255, 255, 0)");

    ctx.strokeStyle = highlightGradient;
    ctx.lineWidth = gridSize * 0.4;
    ctx.stroke();

    ctx.restore();
}

function drawSnakeHead() {
    const head = snake[0];
    const headCenterX = head.x * gridSize + gridSize / 2;
    const headCenterY = head.y * gridSize + gridSize / 2;
    const headRadius = gridSize / 2;

    // Κύριο κεφάλι
    const headGradient = ctx.createRadialGradient(
        headCenterX - 5,
        headCenterY - 5,
        0,
        headCenterX,
        headCenterY,
        headRadius
    );
    headGradient.addColorStop(0, "#00ff99");
    headGradient.addColorStop(1, "#00cc66");

    ctx.fillStyle = headGradient;
    ctx.beginPath();
    ctx.arc(headCenterX, headCenterY, headRadius, 0, Math.PI * 2);
    ctx.fill();

    // Μάτια
    const eyeSize = 5;
    const eyeOffset = 8;

    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.arc(headCenterX - eyeOffset, headCenterY - eyeOffset, eyeSize, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(headCenterX + eyeOffset, headCenterY - eyeOffset, eyeSize, 0, Math.PI * 2);
    ctx.fill();

    // Κόρες
    ctx.fillStyle = "#000";
    const pupilOffsetX = dx * 2;
    const pupilOffsetY = dy * 2;
    ctx.beginPath();
    ctx.arc(
        headCenterX - eyeOffset + pupilOffsetX,
        headCenterY - eyeOffset + pupilOffsetY,
        2.5,
        0,
        Math.PI * 2
    );
    ctx.fill();
    ctx.beginPath();
    ctx.arc(
        headCenterX + eyeOffset + pupilOffsetX,
        headCenterY - eyeOffset + pupilOffsetY,
        2.5,
        0,
        Math.PI * 2
    );
    ctx.fill();

    // Animation φαγητού - στόμα/γλώσσα
    if (isEating) {
        ctx.strokeStyle = "#ff0066";
        ctx.lineWidth = 3;
        ctx.lineCap = "round";

        const tongueLength = eatAnimationFrame * 3;

        ctx.beginPath();
        if (dx === 1) {
            ctx.moveTo(headCenterX + headRadius, headCenterY);
            ctx.lineTo(headCenterX + headRadius + tongueLength, headCenterY);
        } else if (dx === -1) {
            ctx.moveTo(headCenterX - headRadius, headCenterY);
            ctx.lineTo(headCenterX - headRadius - tongueLength, headCenterY);
        } else if (dy === 1) {
            ctx.moveTo(headCenterX, headCenterY + headRadius);
            ctx.lineTo(headCenterX, headCenterY + headRadius + tongueLength);
        } else if (dy === -1) {
            ctx.moveTo(headCenterX, headCenterY - headRadius);
            ctx.lineTo(headCenterX, headCenterY - headRadius - tongueLength);
        }
        ctx.stroke();

        // Διχαλωτή γλώσσα
        ctx.strokeStyle = "#ff0066";
        ctx.lineWidth = 2;
        ctx.beginPath();
        if (dx === 1) {
            const tipX = headCenterX + headRadius + tongueLength;
            ctx.moveTo(tipX, headCenterY);
            ctx.lineTo(tipX + 3, headCenterY - 3);
            ctx.moveTo(tipX, headCenterY);
            ctx.lineTo(tipX + 3, headCenterY + 3);
        } else if (dx === -1) {
            const tipX = headCenterX - headRadius - tongueLength;
            ctx.moveTo(tipX, headCenterY);
            ctx.lineTo(tipX - 3, headCenterY - 3);
            ctx.moveTo(tipX, headCenterY);
            ctx.lineTo(tipX - 3, headCenterY + 3);
        } else if (dy === 1) {
            const tipY = headCenterY + headRadius + tongueLength;
            ctx.moveTo(headCenterX, tipY);
            ctx.lineTo(headCenterX - 3, tipY + 3);
            ctx.moveTo(headCenterX, tipY);
            ctx.lineTo(headCenterX + 3, tipY + 3);
        } else if (dy === -1) {
            const tipY = headCenterY - headRadius - tongueLength;
            ctx.moveTo(headCenterX, tipY);
            ctx.lineTo(headCenterX - 3, tipY - 3);
            ctx.moveTo(headCenterX, tipY);
            ctx.lineTo(headCenterX + 3, tipY - 3);
        }
        ctx.stroke();
    }

    // Φωτεινό περίγραμμα κεφαλιού
    ctx.strokeStyle = "#00f260";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(headCenterX, headCenterY, headRadius, 0, Math.PI * 2);
    ctx.stroke();
}

function drawFood() {
    const x = food.x * gridSize;
    const y = food.y * gridSize;
    const size = gridSize - 4;
    const centerX = x + size / 2;
    const centerY = y + size / 2;

    // Μήλο
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

    // Φωτεινή κουκίδα
    ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
    ctx.beginPath();
    ctx.arc(centerX - 4, centerY - 4, size / 6, 0, Math.PI * 2);
    ctx.fill();

    // Κοτσάνι
    ctx.strokeStyle = "#8b4513";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY - size / 2);
    ctx.lineTo(centerX - 2, centerY - size / 2 - 5);
    ctx.stroke();

    // Φύλλο - μικρότερο και πιο σκούρο
    ctx.fillStyle = "#2d5f3f";
    ctx.beginPath();
    ctx.ellipse(centerX + 2, centerY - size / 2 - 5, 3, 1.5, Math.PI / 4, 0, Math.PI * 2);
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

    // Έλεγχος για σύγκρουση με το σώμα
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
    snake = [{
        x: 10,
        y: 10,
    }, ];
    food = {
        x: 15,
        y: 15,
    };
    dx = 0;
    dy = 0;
    score = 0;
    scoreElement.textContent = score;
    gameRunning = true;
    gamePaused = false;
    gameSpeed = 200; // Επαναφορά στην αρχική ταχύτητα
    isEating = false;
    eatAnimationFrame = 0;
    lastUpdateTime = 0;
    gameOverElement.classList.remove("show");
    pauseScreen.classList.remove("show");
    lastUpdateTime = performance.now();
    requestAnimationFrame(drawGame);
}

window.addEventListener("resize", () => {
    particleCanvas.width = window.innerWidth;
    particleCanvas.height = window.innerHeight;
});

// Αρχική σχεδίαση χωρίς κίνηση
clearCanvas();
drawFood();
drawSnake();
