let ws;
let playerSymbol;
let isMyTurn = false;
let gameOver = false;

// Connect to WebSocket server
function connect() {
    // Use secure WebSocket when deployed
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}`;
    ws = new WebSocket(wsUrl);
    
    ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        
        switch(data.type) {
            case 'init':
                gameOver = false;
                clearBoard();
                playerSymbol = data.symbol;
                isMyTurn = data.symbol === 'X';
                document.getElementById('status').textContent = isMyTurn ? 'Your turn' : "Opponent's turn";
                document.getElementById('newGame').style.display = 'none';
                break;
                
            case 'move':
                handleMove(data.index, data.symbol);
                isMyTurn = data.symbol !== playerSymbol;
                document.getElementById('status').textContent = isMyTurn ? 'Your turn' : "Opponent's turn";
                break;
                
            case 'gameOver':
                gameOver = true;
                document.getElementById('status').textContent = data.winner ? 
                    `Game Over! ${data.winner === playerSymbol ? 'You won!' : 'Opponent won!'}` : 
                    'Game Over! It\'s a draw!';
                document.getElementById('newGame').style.display = 'block';
                break;
                
            case 'status':
                document.getElementById('status').textContent = data.message;
                break;
        }
    };

    ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        document.getElementById('status').textContent = 'Connection error. Please refresh the page.';
    };

    ws.onclose = () => {
        document.getElementById('status').textContent = 'Connection lost. Please refresh the page.';
    };
}

// Handle cell click
document.getElementById('board').addEventListener('click', (e) => {
    if (!isMyTurn) return;
    
    const cell = e.target;
    if (cell.classList.contains('cell') && !cell.textContent) {
        const index = cell.dataset.index;
        ws.send(JSON.stringify({
            type: 'move',
            index: index
        }));
    }
});

function handleMove(index, symbol) {
    const cell = document.querySelector(`[data-index="${index}"]`);
    cell.textContent = symbol;
}

function clearBoard() {
    const cells = document.querySelectorAll('.cell');
    cells.forEach(cell => cell.textContent = '');
}

function requestNewGame() {
    if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'newGame' }));
        document.getElementById('newGame').style.display = 'none';
        document.getElementById('status').textContent = 'Finding new opponent...';
        clearBoard();
    }
}

// Connect when page loads
connect(); 