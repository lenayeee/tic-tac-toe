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

wss.on('connection', (ws) => {
    playerCount++;
    ws.playerId = playerCount;
    
    // Send initial lobby state to new connection
    updateLobbyForAll();
    
    // Handle new connections
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
                // Handle new game request
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
        // Remove from queue if disconnected
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
    res.sendFile(__dirname + '/public/pacman.html');
});

app.get('/snake', (req, res) => {
    res.sendFile(__dirname + '/public/snake.html');
});

// Add a route for the script.js that tictactoe.html needs
app.get('/script.js', (req, res) => {
    res.sendFile(__dirname + '/public/script.js');
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}).on('error', (err) => {
    console.error('Server error:', err);
}); 