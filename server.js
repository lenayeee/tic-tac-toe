const express = require('express');
const { WebSocketServer } = require('ws');
const http = require('http');

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

app.use(express.static('public'));

const games = new Map();
let waitingPlayer = null;
let waitingQueue = []; // Add queue for waiting players
let playerCount = 0;

const snakeGames = new Map();
let waitingSnakePlayer = null;

const pacmanGames = new Map();
let waitingPacmanPlayer = null;

// Add function to start new game
function startNewGame(player1, player2) {
    const gameId = Date.now();
    games.set(gameId, {
        players: [player1, player2],
        board: Array(9).fill(null),
        currentPlayer: 0
    });
    
    player1.gameId = gameId;
    player2.gameId = gameId;
    
    player1.send(JSON.stringify({ type: 'init', symbol: 'X' }));
    player2.send(JSON.stringify({ type: 'init', symbol: 'O' }));
}

function updateLobbyForAll() {
    const queueInfo = {
        type: 'lobbyUpdate',
        waitingCount: waitingQueue.length,
        currentPlayers: Array.from(games.values()).length * 2,
        positions: waitingQueue.map((_, index) => index + 1)
    };
    
    // Send to all connected players
    wss.clients.forEach(client => {
        if (client.readyState === 1) { // if client is connected
            client.send(JSON.stringify(queueInfo));
        }
    });
}

// Add this function to handle Snake game messages
function handleSnakeGame(ws, message) {
    const game = snakeGames.get(ws.gameId);
    if (!game) return;

    switch(message.type) {
        case 'move':
            // Broadcast move to other player
            const otherPlayer = game.players.find(p => p !== ws);
            if (otherPlayer && otherPlayer.readyState === 1) {
                otherPlayer.send(JSON.stringify({
                    type: 'move',
                    player: game.players.indexOf(ws) + 1,
                    direction: message.direction
                }));
            }
            break;

        case 'gameOver':
            game.players.forEach(player => {
                if (player.readyState === 1) {
                    player.send(JSON.stringify({
                        type: 'gameOver',
                        winner: message.winner
                    }));
                }
            });
            snakeGames.delete(ws.gameId);
            break;
    }
}

// Add this function to handle Pacman game messages
function handlePacmanGame(ws, message) {
    const game = pacmanGames.get(ws.gameId);
    if (!game) return;

    switch(message.type) {
        case 'move':
            // Broadcast move to other player
            const otherPlayer = game.players.find(p => p !== ws);
            if (otherPlayer && otherPlayer.readyState === 1) {
                otherPlayer.send(JSON.stringify({
                    type: 'move',
                    player: game.players.indexOf(ws) + 1,
                    direction: message.direction,
                    nextDirection: message.nextDirection,
                    position: message.position
                }));
            }
            break;

        case 'powerPellet':
        case 'dotEaten':
            // Broadcast to both players
            game.players.forEach(player => {
                if (player !== ws && player.readyState === 1) {
                    player.send(JSON.stringify({
                        type: message.type,
                        player: game.players.indexOf(ws) + 1,
                        position: message.position
                    }));
                }
            });
            break;

        case 'gameOver':
            game.players.forEach(player => {
                if (player.readyState === 1) {
                    player.send(JSON.stringify({
                        type: 'gameOver',
                        winner: message.winner,
                        scores: message.scores
                    }));
                }
            });
            pacmanGames.delete(ws.gameId);
            break;
    }
}

wss.on('connection', (ws, req) => {
    console.log('New connection established');  // Add logging
    const gameType = req.url.includes('/snake') ? 'snake' : 
                    req.url.includes('/pacman') ? 'pacman' : 'tictactoe';
    ws.gameType = gameType;
    console.log('Game type:', gameType);  // Add logging

    playerCount++;
    ws.playerId = playerCount;
    
    // Send initial lobby state to new connection
    updateLobbyForAll();
    
    if (gameType === 'snake') {
        if (waitingSnakePlayer) {
            // Start new snake game
            const gameId = Date.now();
            snakeGames.set(gameId, {
                players: [waitingSnakePlayer, ws]
            });
            
            waitingSnakePlayer.gameId = gameId;
            ws.gameId = gameId;
            
            // Assign players
            waitingSnakePlayer.send(JSON.stringify({ type: 'init', player: 1 }));
            ws.send(JSON.stringify({ type: 'init', player: 2 }));
            
            waitingSnakePlayer = null;
        } else {
            waitingSnakePlayer = ws;
        }

        ws.on('message', (message) => {
            try {
                const data = JSON.parse(message);
                handleSnakeGame(ws, data);
            } catch (e) {
                console.error('Error handling snake message:', e);
            }
        });

        ws.on('close', () => {
            if (waitingSnakePlayer === ws) {
                waitingSnakePlayer = null;
            }
            if (ws.gameId && snakeGames.has(ws.gameId)) {
                const game = snakeGames.get(ws.gameId);
                game.players.forEach(player => {
                    if (player !== ws && player.readyState === 1) {
                        player.send(JSON.stringify({ 
                            type: 'gameOver', 
                            winner: game.players.indexOf(player) === 0 ? 'Player 1' : 'Player 2'
                        }));
                    }
                });
                snakeGames.delete(ws.gameId);
            }
        });
    } else if (gameType === 'pacman') {
        if (waitingPacmanPlayer) {
            // Start new Pacman game
            const gameId = Date.now();
            const game = {
                players: [waitingPacmanPlayer, ws],
                started: false
            };
            pacmanGames.set(gameId, game);
            
            waitingPacmanPlayer.gameId = gameId;
            ws.gameId = gameId;
            
            // Assign players and start warm-up
            waitingPacmanPlayer.send(JSON.stringify({ type: 'init', player: 1 }));
            ws.send(JSON.stringify({ type: 'init', player: 2 }));
            
            // Notify both players that game is starting
            game.players.forEach(player => {
                player.send(JSON.stringify({ type: 'playerJoined' }));
            });
            
            waitingPacmanPlayer = null;
        } else {
            waitingPacmanPlayer = ws;
            ws.send(JSON.stringify({ type: 'init', player: 1 }));
        }

        ws.on('message', (message) => {
            try {
                const data = JSON.parse(message);
                handlePacmanGame(ws, data);
            } catch (e) {
                console.error('Error handling pacman message:', e);
            }
        });

        ws.on('close', () => {
            if (waitingPacmanPlayer === ws) {
                waitingPacmanPlayer = null;
            }
            if (ws.gameId && pacmanGames.has(ws.gameId)) {
                const game = pacmanGames.get(ws.gameId);
                game.players.forEach(player => {
                    if (player !== ws && player.readyState === 1) {
                        player.send(JSON.stringify({ 
                            type: 'gameOver', 
                            winner: game.players.indexOf(player) === 0 ? 'Player 1' : 'Player 2'
                        }));
                    }
                });
                pacmanGames.delete(ws.gameId);
            }
        });
    } else {
        // Tic-tac-toe logic
        if (waitingPlayer) {
            startNewGame(waitingPlayer, ws);
            waitingPlayer = null;
            
            // Check queue for next waiting player
            if (waitingQueue.length > 0) {
                waitingPlayer = waitingQueue.shift();
                waitingPlayer.send(JSON.stringify({ 
                    type: 'status', 
                    message: 'Your turn is next! Waiting for opponent...'
                }));
            }
            updateLobbyForAll();
        } else {
            waitingPlayer = ws;
            updateLobbyForAll();
        }

        ws.on('message', (message) => {
            const data = JSON.parse(message);
            const game = games.get(ws.gameId);
            
            if (!game) return;
            
            switch(data.type) {
                case 'move':
                    const playerIndex = game.players.indexOf(ws);
                    const symbol = playerIndex === 0 ? 'X' : 'O';
                    
                    game.board[data.index] = symbol;
                    
                    // Broadcast move to both players
                    game.players.forEach(player => {
                        player.send(JSON.stringify({
                            type: 'move',
                            index: data.index,
                            symbol: symbol
                        }));
                    });
                    
                    // Check for winner
                    const winner = checkWinner(game.board);
                    if (winner || !game.board.includes(null)) {
                        game.players.forEach(player => {
                            player.send(JSON.stringify({
                                type: 'gameOver',
                                winner: winner
                            }));
                        });
                        games.delete(ws.gameId);
                    }
                    break;
                    
                case 'newGame':
                    games.delete(ws.gameId);
                    waitingQueue.push(ws);
                    ws.send(JSON.stringify({ 
                        type: 'status', 
                        message: `You are #${waitingQueue.length} in queue...`
                    }));
                    updateLobbyForAll();
                    break;
            }
        });

        ws.on('close', () => {
            waitingQueue = waitingQueue.filter(player => player !== ws);
            
            if (waitingPlayer === ws) {
                waitingPlayer = null;
                if (waitingQueue.length > 0) {
                    waitingPlayer = waitingQueue.shift();
                    waitingPlayer.send(JSON.stringify({ 
                        type: 'status', 
                        message: 'Your turn is next! Waiting for opponent...'
                    }));
                }
            }
            
            if (ws.gameId && games.has(ws.gameId)) {
                const game = games.get(ws.gameId);
                game.players.forEach(player => {
                    if (player !== ws && player.readyState === 1) {
                        player.send(JSON.stringify({ type: 'gameOver', winner: null }));
                    }
                });
                games.delete(ws.gameId);
            }
            updateLobbyForAll();
        });
    }
});

function checkWinner(board) {
    const lines = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
        [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
        [0, 4, 8], [2, 4, 6] // diagonals
    ];
    
    for (const [a, b, c] of lines) {
        if (board[a] && board[a] === board[b] && board[a] === board[c]) {
            return board[a];
        }
    }
    return null;
}

// Add new routes
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

app.get('/tictactoe', (req, res) => {
    res.sendFile(__dirname + '/public/tictactoe.html');
});

app.get('/pacman', (req, res) => {
    res.sendFile(__dirname + '/public/games/pacman/pacman.html');
});

app.get('/snake', (req, res) => {
    res.sendFile(__dirname + '/public/games/snake/snake.html');
});

// Add a route for the script.js that tictactoe.html needs
app.get('/script.js', (req, res) => {
    res.sendFile(__dirname + '/public/script.js');
});

// Add new route for single player Pacman
app.get('/pacman-single', (req, res) => {
    res.sendFile(__dirname + '/public/games/pacman/pacman-single.html');
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}).on('error', (err) => {
    console.error('Server startup error:', err);  // Enhanced error logging
}); 