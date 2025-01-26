// Add this at the top of the file to check if it's loading
console.log('Pacman game initializing...');

class PacmanGame {
    constructor(canvas, color) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.color = color;
        this.tileSize = 16; // Each tile is 16x16 pixels
        this.score = 0;
        
        // Pacman position and movement
        this.pacman = {
            x: 14 * this.tileSize,
            y: 23 * this.tileSize,
            direction: 'right',
            nextDirection: 'right',
            speed: 2,
            mouthOpen: 0,
            mouthDir: 1
        };

        // Ghost properties
        this.ghosts = [
            { x: 14 * this.tileSize, y: 11 * this.tileSize, color: '#ff0000', direction: 'up' },    // Red
            { x: 12 * this.tileSize, y: 14 * this.tileSize, color: '#00ffff', direction: 'left' },  // Cyan
            { x: 14 * this.tileSize, y: 14 * this.tileSize, color: '#ffb8ff', direction: 'right' }, // Pink
            { x: 16 * this.tileSize, y: 14 * this.tileSize, color: '#ffb852', direction: 'down' }   // Orange
        ];

        // Game state
        this.powerMode = false;
        this.powerModeTimer = 0;
        this.alive = true;
        
        // Initialize the maze
        this.initializeMaze();
    }

    initializeMaze() {
        // 0: empty, 1: wall, 2: dot, 3: power pellet
        this.maze = [
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
            [1,2,2,2,2,2,2,2,2,2,2,2,2,1,1,2,2,2,2,2,2,2,2,2,2,2,2,1],
            [1,2,1,1,1,1,2,1,1,1,1,1,2,1,1,2,1,1,1,1,1,2,1,1,1,1,2,1],
            [1,3,1,1,1,1,2,1,1,1,1,1,2,1,1,2,1,1,1,1,1,2,1,1,1,1,3,1],
            [1,2,1,1,1,1,2,1,1,1,1,1,2,1,1,2,1,1,1,1,1,2,1,1,1,1,2,1],
            [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
            [1,2,1,1,1,1,2,1,1,2,1,1,1,1,1,1,1,1,2,1,1,2,1,1,1,1,2,1],
            [1,2,1,1,1,1,2,1,1,2,1,1,1,1,1,1,1,1,2,1,1,2,1,1,1,1,2,1],
            [1,2,2,2,2,2,2,1,1,2,2,2,2,1,1,2,2,2,2,1,1,2,2,2,2,2,2,1],
            [1,1,1,1,1,1,2,1,1,1,1,1,0,1,1,0,1,1,1,1,1,2,1,1,1,1,1,1],
            [1,1,1,1,1,1,2,1,1,1,1,1,0,1,1,0,1,1,1,1,1,2,1,1,1,1,1,1],
            [1,1,1,1,1,1,2,1,1,0,0,0,0,0,0,0,0,0,0,1,1,2,1,1,1,1,1,1],
            [1,1,1,1,1,1,2,1,1,0,1,1,1,0,0,1,1,1,0,1,1,2,1,1,1,1,1,1],
            [0,0,0,0,0,0,2,0,0,0,1,0,0,0,0,0,0,1,0,0,0,2,0,0,0,0,0,0],
            [1,1,1,1,1,1,2,1,1,0,1,1,1,1,1,1,1,1,0,1,1,2,1,1,1,1,1,1],
            [1,1,1,1,1,1,2,1,1,0,0,0,0,0,0,0,0,0,0,1,1,2,1,1,1,1,1,1],
            [1,1,1,1,1,1,2,1,1,0,1,1,1,1,1,1,1,1,0,1,1,2,1,1,1,1,1,1],
            [1,2,2,2,2,2,2,2,2,2,2,2,2,1,1,2,2,2,2,2,2,2,2,2,2,2,2,1],
            [1,2,1,1,1,1,2,1,1,1,1,1,2,1,1,2,1,1,1,1,1,2,1,1,1,1,2,1],
            [1,2,1,1,1,1,2,1,1,1,1,1,2,1,1,2,1,1,1,1,1,2,1,1,1,1,2,1],
            [1,3,2,2,1,1,2,2,2,2,2,2,2,0,0,2,2,2,2,2,2,2,1,1,2,2,3,1],
            [1,1,1,2,1,1,2,1,1,2,1,1,1,1,1,1,1,1,2,1,1,2,1,1,2,1,1,1],
            [1,1,1,2,1,1,2,1,1,2,1,1,1,1,1,1,1,1,2,1,1,2,1,1,2,1,1,1],
            [1,2,2,2,2,2,2,1,1,2,2,2,2,1,1,2,2,2,2,1,1,2,2,2,2,2,2,1],
            [1,2,1,1,1,1,1,1,1,1,1,1,2,1,1,2,1,1,1,1,1,1,1,1,1,1,2,1],
            [1,2,1,1,1,1,1,1,1,1,1,1,2,1,1,2,1,1,1,1,1,1,1,1,1,1,2,1],
            [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
        ];
    }

    update() {
        if (!this.alive) return;

        this.updatePacman();
        this.updateGhosts();
        this.checkCollisions();
        this.updatePowerMode();
    }

    updatePacman() {
        if (!this.alive) return;

        // Update mouth animation
        this.pacman.mouthOpen += 0.2 * this.pacman.mouthDir;
        if (this.pacman.mouthOpen >= 0.5) this.pacman.mouthDir = -1;
        if (this.pacman.mouthOpen <= 0) this.pacman.mouthDir = 1;

        // Move Pacman
        let nextX = this.pacman.x;
        let nextY = this.pacman.y;

        switch(this.pacman.direction) {
            case 'right': nextX += this.pacman.speed; break;
            case 'left': nextX -= this.pacman.speed; break;
            case 'up': nextY -= this.pacman.speed; break;
            case 'down': nextY += this.pacman.speed; break;
        }

        // Check if next position is valid
        const tileX = Math.floor(nextX / this.tileSize);
        const tileY = Math.floor(nextY / this.tileSize);

        if (this.maze[tileY] && this.maze[tileY][tileX] !== 1) {
            this.pacman.x = nextX;
            this.pacman.y = nextY;

            // Collect dots and power pellets
            if (this.maze[tileY][tileX] === 2) {
                this.maze[tileY][tileX] = 0;
                this.score += 10;
                ws.send(JSON.stringify({
                    type: 'dotEaten',
                    position: { x: tileX, y: tileY }
                }));
            } else if (this.maze[tileY][tileX] === 3) {
                this.maze[tileY][tileX] = 0;
                this.score += 50;
                this.powerMode = true;
                this.powerModeTimer = 600;
                ws.send(JSON.stringify({
                    type: 'powerPellet',
                    position: { x: tileX, y: tileY }
                }));
            }
        }
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw maze
        for (let y = 0; y < this.maze.length; y++) {
            for (let x = 0; x < this.maze[y].length; x++) {
                const tile = this.maze[y][x];
                if (tile === 1) {
                    this.ctx.fillStyle = '#00f';
                    this.ctx.fillRect(x * this.tileSize, y * this.tileSize, this.tileSize, this.tileSize);
                } else if (tile === 2) {
                    this.ctx.fillStyle = '#fff';
                    this.ctx.beginPath();
                    this.ctx.arc(x * this.tileSize + this.tileSize/2, y * this.tileSize + this.tileSize/2, 2, 0, Math.PI * 2);
                    this.ctx.fill();
                } else if (tile === 3) {
                    this.ctx.fillStyle = '#fff';
                    this.ctx.beginPath();
                    this.ctx.arc(x * this.tileSize + this.tileSize/2, y * this.tileSize + this.tileSize/2, 6, 0, Math.PI * 2);
                    this.ctx.fill();
                }
            }
        }

        // Draw ghosts
        this.ghosts.forEach(ghost => {
            this.ctx.fillStyle = this.powerMode ? '#0000ff' : ghost.color;
            this.ctx.beginPath();
            this.ctx.arc(
                ghost.x + this.tileSize/2,
                ghost.y + this.tileSize/2,
                this.tileSize/2,
                0,
                Math.PI * 2
            );
            this.ctx.fill();
        });

        // Draw Pacman
        this.ctx.fillStyle = this.color;
        this.ctx.beginPath();
        const mouthAngle = this.pacman.mouthOpen * Math.PI;
        this.ctx.arc(
            this.pacman.x + this.tileSize/2,
            this.pacman.y + this.tileSize/2,
            this.tileSize/2,
            mouthAngle + this.getDirectionAngle(),
            -mouthAngle + this.getDirectionAngle()
        );
        this.ctx.lineTo(this.pacman.x + this.tileSize/2, this.pacman.y + this.tileSize/2);
        this.ctx.fill();
    }

    getDirectionAngle() {
        switch(this.pacman.direction) {
            case 'right': return 0;
            case 'down': return Math.PI/2;
            case 'left': return Math.PI;
            case 'up': return -Math.PI/2;
        }
    }

    updateGhosts() {
        this.ghosts.forEach(ghost => {
            // Simple ghost movement - can be improved
            const directions = ['up', 'down', 'left', 'right'];
            const validDirections = directions.filter(dir => this.isValidMove(ghost, dir));
            
            if (validDirections.length > 0) {
                // Randomly choose a valid direction
                ghost.direction = validDirections[Math.floor(Math.random() * validDirections.length)];
            }

            // Move ghost
            switch(ghost.direction) {
                case 'up': ghost.y -= 1; break;
                case 'down': ghost.y += 1; break;
                case 'left': ghost.x -= 1; break;
                case 'right': ghost.x += 1; break;
            }
        });
    }

    isValidMove(entity, direction) {
        let nextX = entity.x;
        let nextY = entity.y;

        switch(direction) {
            case 'up': nextY -= this.tileSize; break;
            case 'down': nextY += this.tileSize; break;
            case 'left': nextX -= this.tileSize; break;
            case 'right': nextX += this.tileSize; break;
        }

        const tileX = Math.floor(nextX / this.tileSize);
        const tileY = Math.floor(nextY / this.tileSize);

        return this.maze[tileY] && this.maze[tileY][tileX] !== 1;
    }

    checkCollisions() {
        // Check ghost collisions
        this.ghosts.forEach(ghost => {
            const dx = this.pacman.x - ghost.x;
            const dy = this.pacman.y - ghost.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < this.tileSize) {
                if (this.powerMode) {
                    // Ghost gets eaten
                    ghost.x = 14 * this.tileSize;
                    ghost.y = 14 * this.tileSize;
                    this.score += 200;
                } else {
                    // Pacman gets eaten
                    this.alive = false;
                }
            }
        });
    }

    updatePowerMode() {
        if (this.powerMode) {
            this.powerModeTimer--;
            if (this.powerModeTimer <= 0) {
                this.powerMode = false;
            }
        }
    }
}

// Game setup
let ws;
let player1, player2;
let gameLoop;
let isPlayer1 = false;

function connect() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/pacman`;
    console.log('Attempting to connect to:', wsUrl);
    
    ws = new WebSocket(wsUrl);

    ws.onopen = () => {
        console.log('WebSocket connected successfully');
    };

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

    player1 = new PacmanGame(canvas1, '#ffff00');
    player2 = new PacmanGame(canvas2, '#00ffff');

    document.addEventListener('keydown', handleKeyPress);
}

function handleKeyPress(event) {
    if (!isPlayer1) return; // Only handle input for the current player
    
    const pacman = isPlayer1 ? player1.pacman : player2.pacman;
    let newDirection = pacman.direction;

    if (isPlayer1) {
        switch(event.key.toLowerCase()) {
            case 'w': newDirection = 'up'; break;
            case 's': newDirection = 'down'; break;
            case 'a': newDirection = 'left'; break;
            case 'd': newDirection = 'right'; break;
        }
    } else {
        switch(event.key) {
            case 'ArrowUp': newDirection = 'up'; break;
            case 'ArrowDown': newDirection = 'down'; break;
            case 'ArrowLeft': newDirection = 'left'; break;
            case 'ArrowRight': newDirection = 'right'; break;
        }
    }

    // Send direction change to server
    if (newDirection !== pacman.direction) {
        pacman.direction = newDirection; // Update local direction immediately
        ws.send(JSON.stringify({
            type: 'move',
            direction: newDirection,
            position: {
                x: pacman.x,
                y: pacman.y
            }
        }));
    }
}

function handleGameMessage(data) {
    switch(data.type) {
        case 'init':
            isPlayer1 = data.player === 1;
            document.getElementById('status').textContent = 'Game Started! ' + 
                (isPlayer1 ? 'You are Player 1 (WASD)' : 'You are Player 2 (Arrow Keys)');
            startGameLoop();
            break;
            
        case 'move':
            // Update other player's pacman position and direction
            const otherPlayer = data.player === 1 ? player1 : player2;
            otherPlayer.pacman.direction = data.direction;
            if (data.position) {
                otherPlayer.pacman.x = data.position.x;
                otherPlayer.pacman.y = data.position.y;
            }
            break;
            
        case 'powerPellet':
            // Sync power pellet collection
            const game = data.player === 1 ? player1 : player2;
            game.powerMode = true;
            game.powerModeTimer = 600;
            break;
            
        case 'dotEaten':
            // Sync dot collection
            const playerGame = data.player === 1 ? player1 : player2;
            const {x, y} = data.position;
            playerGame.maze[y][x] = 0;
            break;
            
        case 'gameOver':
            clearInterval(gameLoop);
            document.getElementById('status').textContent = 
                `Game Over! ${data.winner} wins!`;
            break;
    }
}

function startGameLoop() {
    if (gameLoop) clearInterval(gameLoop);
    
    document.getElementById('status').textContent = isPlayer1 ? 
        'You are Player 1 (WASD)' : 
        'You are Player 2 (Arrow Keys)';
    
    gameLoop = setInterval(() => {
        player1.update();
        player2.update();
        
        player1.draw();
        player2.draw();

        // Update scores
        document.getElementById('score1').textContent = player1.score;
        document.getElementById('score2').textContent = player2.score;

        // Check for game over conditions
        if (!player1.alive || !player2.alive) {
            const winner = !player1.alive ? 'Player 2' : 'Player 1';
            ws.send(JSON.stringify({
                type: 'gameOver',
                winner: winner
            }));
            clearInterval(gameLoop);
        }
    }, 1000/60); // 60 FPS
}

// Start the game
connect();
initGame(); 