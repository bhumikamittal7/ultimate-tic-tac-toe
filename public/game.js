// Get room ID from URL
const urlPath = window.location.pathname;
const roomId = urlPath.split('/room/')[1];

if (!roomId) {
    window.location.href = '/';
}

const socket = io();
let gameState = {
    board: Array(9).fill().map(() => Array(9).fill(null)),
    boardWinners: Array(9).fill(null),
    currentPlayer: 0,
    nextBoard: null,
    winner: null
};
let playerSymbol = null;
let isMyTurn = false;
let connected = false;

// DOM elements
const gameBoard = document.getElementById('game-board');
const roomIdSpan = document.getElementById('room-id');
const connectionStatusSpan = document.getElementById('connection-status');
const playerSymbolSpan = document.getElementById('player-symbol');
const currentTurnSpan = document.getElementById('current-turn');
const statusDiv = document.getElementById('status');
const copyLinkBtn = document.getElementById('copy-link-btn');
const leaveGameBtn = document.getElementById('leave-game-btn');

// Initialize
roomIdSpan.textContent = roomId;
connectionStatusSpan.textContent = '🔄 Connecting...';
connectionStatusSpan.className = 'connection-status connecting';
showStatus('Connecting to room...', 'info');

// Handle socket connection
socket.on('connect', () => {
    connectionStatusSpan.textContent = '🟢 Connected';
    connectionStatusSpan.className = 'connection-status connected';
});

socket.on('disconnect', () => {
    connectionStatusSpan.textContent = '🔴 Disconnected';
    connectionStatusSpan.className = 'connection-status error';
    showStatus('Lost connection to server', 'error');
});

// Join the room
socket.emit('join-room', roomId, (response) => {
    if (response.success) {
        connected = true;
        showStatus(`✅ Connected! Waiting for another player... (${response.playerCount}/2)`, 'success');
        playerSymbolSpan.textContent = `Waiting...`;
    } else {
        connectionStatusSpan.textContent = '❌ Error';
        connectionStatusSpan.className = 'connection-status error';
        showStatus(response.message, 'error');
        setTimeout(() => {
            window.location.href = '/';
        }, 3000);
    }
});

// Socket event listeners
socket.on('game-started', (data) => {
    playerSymbol = data.players.indexOf(socket.id) === 0 ? 'X' : 'O';
    playerSymbolSpan.textContent = playerSymbol;
    isMyTurn = data.yourTurn;
    updateTurnDisplay();
    showStatus(`🎮 Game started! You are ${playerSymbol}. ${isMyTurn ? 'Your turn!' : 'Opponent\'s turn'}`, 'success');
});

socket.on('game-update', (data) => {
    gameState = data;
    isMyTurn = (gameState.currentPlayer === 0 && playerSymbol === 'X') ||
               (gameState.currentPlayer === 1 && playerSymbol === 'O');
    renderBoard();
    updateTurnDisplay();
});

socket.on('game-over', (data) => {
    const winner = data.winner;
    const message = winner === playerSymbol ? 'You won!' : winner === 'tie' ? 'It\'s a tie!' : 'You lost!';
    showStatus(`Game Over! ${message}`, winner === playerSymbol ? 'success' : 'info');
    isMyTurn = false;
});

socket.on('player-disconnected', () => {
    showStatus('Opponent disconnected. Waiting for them to reconnect...', 'info');
    isMyTurn = false;
    updateTurnDisplay();
});

// Render the game board
function renderBoard() {
    gameBoard.innerHTML = '';

    for (let boardIndex = 0; boardIndex < 9; boardIndex++) {
        const board = document.createElement('div');
        board.className = 'board';

        // Highlight active board
        if (gameState.nextBoard === null || gameState.nextBoard === boardIndex) {
            board.classList.add('active');
        }

        // Mark won boards
        if (gameState.boardWinners[boardIndex]) {
            board.classList.add('won');
        }

        for (let cellIndex = 0; cellIndex < 9; cellIndex++) {
            const cell = document.createElement('button');
            cell.className = 'cell';
            cell.dataset.boardIndex = boardIndex;
            cell.dataset.cellIndex = cellIndex;

            const cellValue = gameState.board[boardIndex][cellIndex];
            if (cellValue) {
                cell.textContent = cellValue;
                cell.classList.add(cellValue.toLowerCase());
            }

            // Determine if cell is clickable
            const canPlayHere = isMyTurn &&
                (gameState.nextBoard === null || gameState.nextBoard === boardIndex) &&
                !cellValue &&
                !gameState.boardWinners[boardIndex];

            if (!canPlayHere) {
                cell.classList.add('disabled');
                cell.disabled = true;
            } else {
                cell.addEventListener('click', handleCellClick);
            }

            board.appendChild(cell);
        }

        gameBoard.appendChild(board);
    }
}

// Handle cell clicks
function handleCellClick(e) {
    const boardIndex = parseInt(e.target.dataset.boardIndex);
    const cellIndex = parseInt(e.target.dataset.cellIndex);

    socket.emit('make-move', {
        roomId: roomId,
        boardIndex: boardIndex,
        cellIndex: cellIndex
    });
}

// Update turn display
function updateTurnDisplay() {
    if (!playerSymbol) {
        currentTurnSpan.textContent = 'Waiting for opponent...';
        return;
    }

    if (gameState.winner) {
        currentTurnSpan.textContent = 'Game Over';
        return;
    }

    const currentSymbol = gameState.currentPlayer === 0 ? 'X' : 'O';
    if (isMyTurn) {
        currentTurnSpan.textContent = 'Your turn';
        currentTurnSpan.style.color = '#27ae60';
    } else {
        currentTurnSpan.textContent = `${currentSymbol}'s turn`;
        currentTurnSpan.style.color = '#e74c3c';
    }
}

// Copy invite link
copyLinkBtn.addEventListener('click', () => {
    const inviteLink = `${window.location.origin}/room/${roomId}`;
    navigator.clipboard.writeText(inviteLink).then(() => {
        showStatus('🎯 Room link copied! Share it with a friend to play.', 'success');
    }).catch(() => {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = inviteLink;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        showStatus('🎯 Room link copied! Share it with a friend to play.', 'success');
    });
});

// Leave game
leaveGameBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to leave the game?')) {
        window.location.href = '/';
    }
});

// Status message display
function showStatus(message, type = 'info') {
    statusDiv.textContent = message;
    statusDiv.className = `status ${type}`;
    statusDiv.style.display = 'block';

    // Auto-hide after 5 seconds
    setTimeout(() => {
        statusDiv.style.display = 'none';
    }, 5000);
}

// Initial render
renderBoard();
