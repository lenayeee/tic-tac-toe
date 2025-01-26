let ws;
let playerSymbol;
let isMyTurn = false;

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
                playerSymbol = data.symbol;
                isMyTurn = data.symbol === 'X';
                document.getElementById('status').textContent = isMyTurn ? 'Your turn' : "Opponent's turn";
                break;
                
            case 'move':
                handleMove(data.index, data.symbol);
                isMyTurn = data.symbol !== playerSymbol;
                document.getElementById('status').textContent = isMyTurn ? 'Your turn' : "Opponent's turn";
                break;
                
            case 'gameOver':
                document.getElementById('status').textContent = data.winner ? 
                    `Game Over! ${data.winner === playerSymbol ? 'You won!' : 'Opponent won!'}` : 
                    'Game Over! It\'s a draw!';
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

// Connect when page loads
connect(); 