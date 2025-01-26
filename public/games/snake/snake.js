class Snake {
    constructor(canvas, color) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.color = color;
        this.gridSize = 20;
        this.snake = [{x: 5, y: 5}];
        this.direction = 'right';
        this.food = this.generateFood();
        this.score = 0;
        this.growing = false;
    }

    generateFood() {
        const maxX = this.canvas.width / this.gridSize - 1;
        const maxY = this.canvas.height / this.gridSize - 1;
        return {
            x: Math.floor(Math.random() * maxX),
            y: Math.floor(Math.random() * maxY)
        };
    }

    update() {
        const head = {...this.snake[0]};

        switch(this.direction) {
            case 'up': head.y--; break;
            case 'down': head.y++; break;
            case 'left': head.x--; break;
            case 'right': head.x++; break;
        }

        // Check wall collision
        if (head.x < 0 || head.x >= this.canvas.width / this.gridSize ||
            head.y < 0 || head.y >= this.canvas.height / this.gridSize) {
            return false;
        }

        // Check self collision
        if (this.snake.some(segment => segment.x === head.x && segment.y === head.y)) {
            return false;
        }

        this.snake.unshift(head);

        // Check food collision
        if (head.x === this.food.x && head.y === this.food.y) {
            this.score += 10;
            this.food = this.generateFood();
            this.growing = true;
        }

        if (!this.growing) {
            this.snake.pop();
        }
        this.growing = false;

        return true;
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw snake
        this.ctx.fillStyle = this.color;
        this.snake.forEach(segment => {
            this.ctx.fillRect(
                segment.x * this.gridSize,
                segment.y * this.gridSize,
                this.gridSize - 2,
                this.gridSize - 2
            );
        });

        // Draw food
        this.ctx.fillStyle = '#ff0000';
        this.ctx.fillRect(
            this.food.x * this.gridSize,
            this.food.y * this.gridSize,
            this.gridSize - 2,
            this.gridSize - 2
        );
    }
}

// Game setup
let ws;
let player1, player2;
let gameLoop;
let isPlayer1 = false;

function connect() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/snake`;
    ws = new WebSocket(wsUrl);

    ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        handleGameMessage(data);
    };

    ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        document.getElementById('status').textContent = 'Connection error. Please refresh the page.';
    };

    ws.onclose = () => {
        if (gameLoop) clearInterval(gameLoop);
        document.getElementById('status').textContent = 'Connection lost. Please refresh the page.';
    };
}

function initGame() {
    const canvas1 = document.getElementById('player1Canvas');
    const canvas2 = document.getElementById('player2Canvas');

    player1 = new Snake(canvas1, '#00ff00');
    player2 = new Snake(canvas2, '#0000ff');

    document.addEventListener('keydown', handleKeyPress);
}

function handleKeyPress(event) {
    const snake = isPlayer1 ? player1 : player2;
    
    if (isPlayer1) {
        switch(event.key.toLowerCase()) {
            case 'w': snake.direction = 'up'; break;
            case 's': snake.direction = 'down'; break;
            case 'a': snake.direction = 'left'; break;
            case 'd': snake.direction = 'right'; break;
        }
    } else {
        switch(event.key) {
            case 'ArrowUp': snake.direction = 'up'; break;
            case 'ArrowDown': snake.direction = 'down'; break;
            case 'ArrowLeft': snake.direction = 'left'; break;
            case 'ArrowRight': snake.direction = 'right'; break;
        }
    }

    ws.send(JSON.stringify({
        type: 'move',
        direction: snake.direction
    }));
}

function handleGameMessage(data) {
    switch(data.type) {
        case 'init':
            isPlayer1 = data.player === 1;
            document.getElementById('status').textContent = 'Game Started!';
            gameLoop = setInterval(updateGame, 100);
            break;
            
        case 'move':
            if (data.player === 1) {
                player1.direction = data.direction;
            } else {
                player2.direction = data.direction;
            }
            break;
            
        case 'gameOver':
            clearInterval(gameLoop);
            document.getElementById('status').textContent = 
                `Game Over! ${data.winner} wins!`;
            break;
    }
}

function updateGame() {
    const alive1 = player1.update();
    const alive2 = player2.update();

    player1.draw();
    player2.draw();

    document.getElementById('score1').textContent = player1.score;
    document.getElementById('score2').textContent = player2.score;

    if (!alive1 || !alive2) {
        clearInterval(gameLoop);
        const winner = !alive1 ? 'Player 2' : 'Player 1';
        ws.send(JSON.stringify({
            type: 'gameOver',
            winner: winner
        }));
    }
}

// Start the game
connect();
initGame(); 