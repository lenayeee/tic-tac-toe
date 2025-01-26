// Single player Pacman game
class PacmanGame {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.tileSize = 16;
        this.score = 0;
        this.lives = 3;
        this.level = 1;
        this.highScore = parseInt(localStorage.getItem('pacmanHighScore')) || 0;
        this.dotsRemaining = 0;
        this.gameStarted = false;

        // Initialize the maze first
        this.initializeMaze();

        // Set starting position
        const startTileX = 14;
        const startTileY = 26;
        
        this.pacman = {
            x: startTileX * this.tileSize,
            y: startTileY * this.tileSize,
            direction: 'left',
            nextDirection: 'left',
            speed: 2,
            mouthOpen: 0,
            mouthDir: 1
        };

        // Ghost properties with different behaviors
        this.ghosts = [
            { x: 13 * this.tileSize, y: 14 * this.tileSize, color: '#ff0000', direction: 'up', mode: 'scatter' },    // Red - direct chase
            { x: 14 * this.tileSize, y: 14 * this.tileSize, color: '#ffb8ff', direction: 'left', mode: 'scatter' },  // Pink - intercept
            { x: 15 * this.tileSize, y: 14 * this.tileSize, color: '#00ffff', direction: 'right', mode: 'scatter' }, // Cyan - flank
            { x: 14 * this.tileSize, y: 15 * this.tileSize, color: '#ffb852', direction: 'down', mode: 'scatter' }   // Orange - random
        ];

        // Game state
        this.powerMode = false;
        this.powerModeTimer = 0;
        this.alive = true;
        this.paused = false;

        // Load sounds
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

        // Ghost behavior settings based on difficulty
        this.ghostSettings = {
            easy: {
                speed: 1,
                chaseChance: 0.1,
                scatterTime: 300
            },
            medium: {
                speed: 1.5,
                chaseChance: 0.4,
                scatterTime: 200
            },
            hard: {
                speed: 2,
                chaseChance: 0.8,
                scatterTime: 100
            }
        };

        this.difficulty = 'medium';
        this.countDots();
    }

    countDots() {
        this.dotsRemaining = 0;
        for (let row of this.maze) {
            for (let cell of row) {
                if (cell === 2) this.dotsRemaining++;
            }
        }
    }

    initializeMaze() {
        // Same maze initialization as multiplayer version
        // ... (copy the initializeMaze method from the multiplayer version)
    }

    start() {
        if (!this.gameStarted) {
            this.gameStarted = true;
            this.sounds.start.play();
            this.startGameLoop();
        }
    }

    startGameLoop() {
        if (this.gameLoop) clearInterval(this.gameLoop);
        
        this.gameLoop = setInterval(() => {
            if (!this.paused) {
                this.update();
                this.draw();
                this.updateScore();
                this.checkLevelComplete();
            }
        }, 1000/60);
    }

    updateScore() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('lives').textContent = this.lives;
        document.getElementById('level').textContent = this.level;
        
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('pacmanHighScore', this.highScore);
            document.getElementById('highScore').textContent = this.highScore;
        }
    }

    checkLevelComplete() {
        if (this.dotsRemaining === 0) {
            this.level++;
            this.sounds.victory.play();
            this.paused = true;
            
            // Increase difficulty with each level
            this.ghostSettings.easy.speed += 0.1;
            this.ghostSettings.medium.speed += 0.1;
            this.ghostSettings.hard.speed += 0.1;

            setTimeout(() => {
                this.resetLevel();
                this.paused = false;
            }, 2000);
        }
    }

    resetLevel() {
        this.initializeMaze();
        this.countDots();
        this.resetPositions();
    }

    resetPositions() {
        // Reset Pacman
        this.pacman.x = 14 * this.tileSize;
        this.pacman.y = 26 * this.tileSize;
        this.pacman.direction = 'left';
        this.pacman.nextDirection = 'left';

        // Reset ghosts to starting positions
        this.ghosts[0].x = 13 * this.tileSize; this.ghosts[0].y = 14 * this.tileSize;
        this.ghosts[1].x = 14 * this.tileSize; this.ghosts[1].y = 14 * this.tileSize;
        this.ghosts[2].x = 15 * this.tileSize; this.ghosts[2].y = 14 * this.tileSize;
        this.ghosts[3].x = 14 * this.tileSize; this.ghosts[3].y = 15 * this.tileSize;
    }

    handleDeath() {
        this.lives--;
        this.sounds.death.play();
        this.paused = true;

        if (this.lives > 0) {
            setTimeout(() => {
                this.resetPositions();
                this.paused = false;
                this.alive = true;
            }, 2000);
        } else {
            this.gameOver();
        }
    }

    gameOver() {
        clearInterval(this.gameLoop);
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.fillStyle = '#ff0';
        this.ctx.font = '48px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('GAME OVER', this.canvas.width/2, this.canvas.height/2);
        
        this.ctx.font = '24px Arial';
        this.ctx.fillText(`Final Score: ${this.score}`, this.canvas.width/2, this.canvas.height/2 + 40);
        this.ctx.fillText('Press Space to Play Again', this.canvas.width/2, this.canvas.height/2 + 80);
    }

    // ... (copy the remaining methods from multiplayer version)
    // Including: update(), draw(), updatePacman(), updateGhosts(), etc.
}

// Game initialization
let game;
let difficultySelected = false;

function initGame() {
    const canvas = document.getElementById('gameCanvas');
    game = new PacmanGame(canvas);
    
    // Handle keyboard controls
    document.addEventListener('keydown', (event) => {
        if (event.key.includes('Arrow')) {
            event.preventDefault(); // Prevent scrolling
            
            if (!difficultySelected) return;
            
            let newDirection;
            switch(event.key) {
                case 'ArrowUp': newDirection = 'up'; break;
                case 'ArrowDown': newDirection = 'down'; break;
                case 'ArrowLeft': newDirection = 'left'; break;
                case 'ArrowRight': newDirection = 'right'; break;
            }
            
            if (newDirection) {
                game.pacman.nextDirection = newDirection;
                if (!game.gameStarted) game.start();
            }
        } else if (event.code === 'Space' && !game.alive) {
            location.reload(); // Restart game
        }
    });

    initMobileControls();
    initDifficultySelect();
}

// ... (copy initMobileControls from multiplayer version)

function initDifficultySelect() {
    const buttons = document.querySelectorAll('.difficulty-btn');
    const difficultySelect = document.getElementById('difficultySelect');
    
    buttons.forEach(button => {
        button.addEventListener('click', () => {
            difficultySelected = true;
            game.difficulty = button.dataset.difficulty;
            difficultySelect.style.display = 'none';
            game.start();
        });
    });
}

// Start the game
document.addEventListener('DOMContentLoaded', initGame); 