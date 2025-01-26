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
            x: 14 * this.tileSize,  // Center X position
            y: 26 * this.tileSize,  // Bottom path position
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

        // Add classic Pacman sounds
        this.sounds = {
            start: new Audio('/games/pacman/sounds/game_start.wav'),
            chomp: new Audio('/games/pacman/sounds/chomp.wav'),
            death: new Audio('/games/pacman/sounds/death.wav'),
            powerPellet: new Audio('/games/pacman/sounds/power_pellet.wav'),
            ghostEaten: new Audio('/games/pacman/sounds/ghost_eaten.wav'),
            ghostRetreat: new Audio('/games/pacman/sounds/retreat.wav'),
            victory: new Audio('/games/pacman/sounds/victory.wav')
        };

        // Preload sounds
        Object.values(this.sounds).forEach(sound => {
            sound.load();
        });

        // Add difficulty setting
        this.difficulty = 'medium'; // default
        
        // Ghost behavior settings
        this.ghostSettings = {
            easy: {
                speed: 1,
                chaseChance: 0.1,  // 10% chance to chase
                scatterTime: 300    // Longer scatter time
            },
            medium: {
                speed: 1.5,
                chaseChance: 0.4,   // 40% chance to chase
                scatterTime: 200    // Medium scatter time
            },
            hard: {
                speed: 2,
                chaseChance: 0.8,   // 80% chance to chase
                scatterTime: 100    // Short scatter time
            }
        };
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
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
            [1,1,1,1,1,1,2,1,1,1,1,1,1,4,4,1,1,1,1,1,1,2,1,1,1,1,1,1]
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

        // Get current tile position
        const currentTileX = Math.round(this.pacman.x / this.tileSize);
        const currentTileY = Math.round(this.pacman.y / this.tileSize);
        
        // Perfect alignment coordinates
        const perfectX = currentTileX * this.tileSize;
        const perfectY = currentTileY * this.tileSize;
        
        // Check if we're close to perfect alignment
        const isAlignedX = Math.abs(this.pacman.x - perfectX) < this.pacman.speed;
        const isAlignedY = Math.abs(this.pacman.y - perfectY) < this.pacman.speed;

        // If we're aligned, try to change direction
        if (isAlignedX && isAlignedY) {
            // Snap to grid when aligned
            this.pacman.x = perfectX;
            this.pacman.y = perfectY;

            // Check if we can move in the next direction
            let nextTileX = currentTileX;
            let nextTileY = currentTileY;

            switch(this.pacman.nextDirection) {
                case 'up': nextTileY--; break;
                case 'down': nextTileY++; break;
                case 'left': nextTileX--; break;
                case 'right': nextTileX++; break;
            }

            // If next direction is valid, change to it
            if (this.maze[nextTileY] && this.maze[nextTileY][nextTileX] !== 1) {
                this.pacman.direction = this.pacman.nextDirection;
            }
        }

        // Move in current direction
        let nextX = this.pacman.x;
        let nextY = this.pacman.y;

        switch(this.pacman.direction) {
            case 'right': nextX += this.pacman.speed; break;
            case 'left': nextX -= this.pacman.speed; break;
            case 'up': nextY -= this.pacman.speed; break;
            case 'down': nextY += this.pacman.speed; break;
        }

        // Check if next position is valid
        const nextTileX = Math.floor(nextX / this.tileSize);
        const nextTileY = Math.floor(nextY / this.tileSize);

        if (this.maze[nextTileY] && this.maze[nextTileY][nextTileX] !== 1) {
            this.pacman.x = nextX;
            this.pacman.y = nextY;

            // Handle dot collection
            if (this.maze[nextTileY][nextTileX] === 2) {
                this.maze[nextTileY][nextTileX] = 0;
                this.score += 10;
                this.sounds.chomp.play();
                ws.send(JSON.stringify({
                    type: 'dotEaten',
                    position: { x: nextTileX, y: nextTileY }
                }));
            } else if (this.maze[nextTileY][nextTileX] === 3) {
                this.maze[nextTileY][nextTileX] = 0;
                this.score += 50;
                this.powerMode = true;
                this.powerModeTimer = 600;
                this.sounds.powerPellet.play();
                ws.send(JSON.stringify({
                    type: 'powerPellet',
                    position: { x: nextTileX, y: nextTileY }
                }));
            }
        }

        // Handle tunnel wrapping
        if (this.pacman.x < 0) {
            this.pacman.x = this.canvas.width - this.tileSize;
        } else if (this.pacman.x >= this.canvas.width) {
            this.pacman.x = 0;
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

        // Draw ghost house door
        for (let y = 0; y < this.maze.length; y++) {
            for (let x = 0; x < this.maze[y].length; x++) {
                if (this.maze[y][x] === 4) {
                    this.ctx.fillStyle = '#ffb852';  // Door color
                    this.ctx.fillRect(
                        x * this.tileSize, 
                        y * this.tileSize + this.tileSize/2, 
                        this.tileSize, 
                        this.tileSize/4
                    );
                }
            }
        }
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
        const settings = this.ghostSettings[this.difficulty];
        
        this.ghosts.forEach((ghost, index) => {
            if (this.powerMode) {
                // Run away from Pacman when in power mode
                this.moveGhostAway(ghost);
                return;
            }

            // Different behaviors for each ghost
            if (Math.random() < settings.chaseChance) {
                switch(index) {
                    case 0: // Red ghost - direct chase
                        this.chaseTarget(ghost, this.pacman);
                        break;
                    case 1: // Pink ghost - intercept
                        const target = this.getInterceptPoint();
                        this.chaseTarget(ghost, target);
                        break;
                    case 2: // Blue ghost - flank
                        this.flankPacman(ghost);
                        break;
                    case 3: // Orange ghost - random with occasional chase
                        if (Math.random() < 0.3) {
                            this.chaseTarget(ghost, this.pacman);
                        } else {
                            this.moveRandomly(ghost);
                        }
                        break;
                }
            } else {
                this.moveRandomly(ghost);
            }
        });
    }

    chaseTarget(ghost, target) {
        const dx = target.x - ghost.x;
        const dy = target.y - ghost.y;
        const directions = [];

        if (Math.abs(dx) > Math.abs(dy)) {
            directions.push(dx > 0 ? 'right' : 'left');
            directions.push(dy > 0 ? 'down' : 'up');
        } else {
            directions.push(dy > 0 ? 'down' : 'up');
            directions.push(dx > 0 ? 'right' : 'left');
        }

        // Try primary direction first, then secondary
        for (let dir of directions) {
            if (this.isValidMove(ghost, dir)) {
                this.moveGhost(ghost, dir);
                return;
            }
        }

        // If no preferred direction is valid, move randomly
        this.moveRandomly(ghost);
    }

    moveGhostAway(ghost) {
        const dx = ghost.x - this.pacman.x;
        const dy = ghost.y - this.pacman.y;
        const directions = [];

        if (Math.abs(dx) > Math.abs(dy)) {
            directions.push(dx < 0 ? 'left' : 'right');
            directions.push(dy < 0 ? 'up' : 'down');
        } else {
            directions.push(dy < 0 ? 'up' : 'down');
            directions.push(dx < 0 ? 'left' : 'right');
        }

        for (let dir of directions) {
            if (this.isValidMove(ghost, dir)) {
                this.moveGhost(ghost, dir);
                return;
            }
        }

        this.moveRandomly(ghost);
    }

    getInterceptPoint() {
        // Predict where Pacman will be in a few steps
        const steps = 4;
        const predictedX = this.pacman.x + (steps * this.pacman.speed * 
            (this.pacman.direction === 'right' ? 1 : this.pacman.direction === 'left' ? -1 : 0));
        const predictedY = this.pacman.y + (steps * this.pacman.speed * 
            (this.pacman.direction === 'down' ? 1 : this.pacman.direction === 'up' ? -1 : 0));
        
        return { x: predictedX, y: predictedY };
    }

    flankPacman(ghost) {
        // Move to Pacman's side
        const offset = 4 * this.tileSize;
        const target = {
            x: this.pacman.x + (Math.random() < 0.5 ? offset : -offset),
            y: this.pacman.y + (Math.random() < 0.5 ? offset : -offset)
        };
        this.chaseTarget(ghost, target);
    }

    moveRandomly(ghost) {
        const directions = ['up', 'down', 'left', 'right'];
        const validDirections = directions.filter(dir => this.isValidMove(ghost, dir));
        
        if (validDirections.length > 0) {
            const dir = validDirections[Math.floor(Math.random() * validDirections.length)];
            this.moveGhost(ghost, dir);
        }
    }

    moveGhost(ghost, direction) {
        const settings = this.ghostSettings[this.difficulty];
        switch(direction) {
            case 'up': ghost.y -= settings.speed; break;
            case 'down': ghost.y += settings.speed; break;
            case 'left': ghost.x -= settings.speed; break;
            case 'right': ghost.x += settings.speed; break;
        }
        ghost.direction = direction;
    }

    isValidMove(entity, direction) {
        let nextX = entity.x;
        let nextY = entity.y;
        const margin = 2; // Add a small margin for better collision

        switch(direction) {
            case 'up': nextY -= this.pacman.speed; break;
            case 'down': nextY += this.pacman.speed; break;
            case 'left': nextX -= this.pacman.speed; break;
            case 'right': nextX += this.pacman.speed; break;
        }

        // Check all corners of the entity
        const points = [
            { x: nextX + margin, y: nextY + margin },
            { x: nextX + this.tileSize - margin, y: nextY + margin },
            { x: nextX + margin, y: nextY + this.tileSize - margin },
            { x: nextX + this.tileSize - margin, y: nextY + this.tileSize - margin }
        ];

        // If any corner hits a wall, movement is invalid
        return !points.some(point => {
            const tileX = Math.floor(point.x / this.tileSize);
            const tileY = Math.floor(point.y / this.tileSize);
            return !this.maze[tileY] || this.maze[tileY][tileX] === 1;
        });
    }

    checkCollisions() {
        this.ghosts.forEach(ghost => {
            const dx = this.pacman.x - ghost.x;
            const dy = this.pacman.y - ghost.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < this.tileSize) {
                if (this.powerMode) {
                    ghost.x = 14 * this.tileSize;
                    ghost.y = 14 * this.tileSize;
                    this.score += 200;
                    this.sounds.ghostEaten.play();
                } else {
                    this.alive = false;
                    this.sounds.death.play();
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

    setDifficulty(level) {
        this.difficulty = level;
        // Update ghost speeds
        const settings = this.ghostSettings[level];
        this.ghosts.forEach(ghost => {
            ghost.speed = settings.speed;
        });
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

function initMobileControls() {
    const buttons = document.querySelectorAll('.control-btn');
    
    buttons.forEach(button => {
        // Handle touch start
        button.addEventListener('touchstart', (e) => {
            e.preventDefault(); // Prevent default touch behavior
            const key = button.getAttribute('data-key');
            
            // Create and dispatch a keyboard event
            const event = new KeyboardEvent('keydown', {
                key: key,
                bubbles: true
            });
            document.dispatchEvent(event);
        });

        // Handle touch end
        button.addEventListener('touchend', (e) => {
            e.preventDefault();
        });

        // Prevent default touch behavior
        button.addEventListener('touchmove', (e) => {
            e.preventDefault();
        });
    });
}

function initDifficultySelect() {
    const difficultySelect = document.getElementById('difficultySelect');
    const buttons = document.querySelectorAll('.difficulty-btn');
    const gameContainer = document.querySelector('.game-container');

    buttons.forEach(button => {
        button.addEventListener('click', () => {
            const difficulty = button.dataset.difficulty;
            player1.setDifficulty(difficulty);
            player2.setDifficulty(difficulty);
            
            // Hide difficulty select and show game
            difficultySelect.style.display = 'none';
            gameContainer.style.display = 'flex';
            
            // Start the game
            startGameLoop();
        });
    });
}

function initGame() {
    const canvas1 = document.getElementById('player1Canvas');
    const canvas2 = document.getElementById('player2Canvas');

    // Scale canvas for mobile
    function resizeCanvas() {
        if (window.innerWidth <= 768) {
            const maxWidth = Math.min(window.innerWidth - 20, 448);
            const scale = maxWidth / 448;
            
            [canvas1, canvas2].forEach(canvas => {
                canvas.style.width = `${maxWidth}px`;
                canvas.style.height = `${496 * scale}px`;
            });
        }
    }

    // Call once and add resize listener
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    player1 = new PacmanGame(canvas1, '#ffff00');
    player2 = new PacmanGame(canvas2, '#00ffff');

    // Draw initial state immediately
    player1.draw();
    player2.draw();

    document.addEventListener('keydown', handleKeyPress);
    initMobileControls();
    initDifficultySelect();
}

function handleKeyPress(event) {
    // Prevent scrolling with arrow keys
    if (event.key.includes('Arrow') || 
        event.key.toLowerCase() === 'w' || 
        event.key.toLowerCase() === 's') {
        event.preventDefault();
    }

    let newDirection;
    let currentPlayer;

    // Determine which player is making the move
    if (event.key.toLowerCase() === 'w' || 
        event.key.toLowerCase() === 'a' || 
        event.key.toLowerCase() === 's' || 
        event.key.toLowerCase() === 'd') {
        // Player 1 controls
        if (!isPlayer1) return; // Only handle if we are Player 1
        currentPlayer = player1;
        switch(event.key.toLowerCase()) {
            case 'w': newDirection = 'up'; break;
            case 's': newDirection = 'down'; break;
            case 'a': newDirection = 'left'; break;
            case 'd': newDirection = 'right'; break;
        }
    } else if (event.key.includes('Arrow')) {
        // Player 2 controls
        if (isPlayer1) return; // Only handle if we are Player 2
        currentPlayer = player2;
        switch(event.key) {
            case 'ArrowUp': newDirection = 'up'; break;
            case 'ArrowDown': newDirection = 'down'; break;
            case 'ArrowLeft': newDirection = 'left'; break;
            case 'ArrowRight': newDirection = 'right'; break;
        }
    }

    // Send direction change to server if we have a valid move
    if (newDirection && currentPlayer) {
        // Update both current and next direction
        currentPlayer.pacman.nextDirection = newDirection;
        currentPlayer.pacman.direction = newDirection;
        
        ws.send(JSON.stringify({
            type: 'move',
            direction: newDirection,
            nextDirection: newDirection,
            position: {
                x: currentPlayer.pacman.x,
                y: currentPlayer.pacman.y
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
            otherPlayer.pacman.nextDirection = data.direction;
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
            let winner;
            if (!player1.alive && !player2.alive) {
                // Both dead, highest score wins
                winner = player1.score > player2.score ? 'Player 1' : 
                        player2.score > player1.score ? 'Player 2' : 
                        'Tie';
            } else {
                // One player alive, check scores
                if (!player1.alive) {
                    winner = player1.score > player2.score ? 'Player 1' : 'Player 2';
                } else {
                    winner = player2.score > player1.score ? 'Player 2' : 'Player 1';
                }
            }
            
            ws.send(JSON.stringify({
                type: 'gameOver',
                winner: winner,
                scores: {
                    player1: player1.score,
                    player2: player2.score
                }
            }));
            clearInterval(gameLoop);
        }
    }, 1000/60); // 60 FPS
}

// Start the game
connect();
initGame(); 