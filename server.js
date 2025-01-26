const express = require('express');
const { WebSocketServer } = require('ws');
const http = require('http');

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

app.use(express.static('public'));

const games = new Map();
let waitingPlayer = null;

wss.on('connection', (ws) => {
    if (waitingPlayer) {
        // Start new game
        const gameId = Date.now();
        games.set(gameId, {
            players: [waitingPlayer, ws],
            board: Array(9).fill(null),
            currentPlayer: 0
        });
        
        // Assign symbols
        waitingPlayer.gameId = gameId;
        ws.gameId = gameId;
        
        waitingPlayer.send(JSON.stringify({ type: 'init', symbol: 'X' }));
        ws.send(JSON.stringify({ type: 'init', symbol: 'O' }));
        
        waitingPlayer = null;
    } else {
        waitingPlayer = ws;
    }
    
    ws.on('message', (message) => {
        const data = JSON.parse(message);
        const game = games.get(ws.gameId);
        
        if (!game) return;
        
        if (data.type === 'move') {
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
        }
    });
    
    ws.on('close', () => {
        if (waitingPlayer === ws) {
            waitingPlayer = null;
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

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
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