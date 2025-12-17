// Get player names from localStorage
const player1Name = localStorage.getItem('player1Name') || 'Player 1';
const player2Name = localStorage.getItem('player2Name') || 'Player 2';

// DOM elements
const gameBoard = document.getElementById('game-board');
const currentPlayerDisplay = document.getElementById('current-player-display');
const nextBoardInfo = document.getElementById('next-board-info');
const statusDiv = document.getElementById('status');
const newGameBtn = document.getElementById('new-game-btn');
const backToMenuBtn = document.getElementById('back-to-menu-btn');

// Game state
let gameState = {
    board: Array(9).fill().map(() => Array(9).fill(null)), // 9x9 board
    boardWinners: Array(9).fill(null), // winners of each small board
    currentPlayer: 0, // 0 for player 1 (X), 1 for player 2 (O)
    nextBoard: null, // which board the next player must play in
    winner: null,
    playerNames: [player1Name, player2Name]
};

// Initialize game
function initGame() {
    gameState = {
        board: Array(9).fill().map(() => Array(9).fill(null)),
        boardWinners: Array(9).fill(null),
        currentPlayer: 0,
        nextBoard: null,
        winner: null,
        playerNames: [player1Name, player2Name]
    };
    renderBoard();
    updateDisplay();
}

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
            const canPlayHere = !gameState.winner &&
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
    const cell = e.target;
    const boardIndex = parseInt(cell.dataset.boardIndex);
    const cellIndex = parseInt(cell.dataset.cellIndex);

    // Make the move
    if (makeMove(boardIndex, cellIndex)) {
        // Re-render the board to show the move
        renderBoard();

        // Switch turns
        gameState.currentPlayer = 1 - gameState.currentPlayer;

        // Check for overall winner
        const overallWinner = checkOverallWinner();
        if (overallWinner) {
            gameState.winner = overallWinner;
            showStatus(`${gameState.playerNames[overallWinner === 'X' ? 0 : 1]} wins the game!`, 'success');
        } else {
            updateDisplay();
        }
    }
}

// Make a move
function makeMove(boardIndex, cellIndex) {
    // Check if move is valid
    if (gameState.nextBoard !== null && gameState.nextBoard !== boardIndex) {
        showStatus('You must play in the highlighted board!', 'error');
        return false;
    }

    if (gameState.board[boardIndex][cellIndex] !== null) {
        return false;
    }

    if (gameState.boardWinners[boardIndex] !== null) {
        return false;
    }

    // Make the move
    const symbol = gameState.currentPlayer === 0 ? 'X' : 'O';
    gameState.board[boardIndex][cellIndex] = symbol;

    // Check if this move wins the small board
    if (checkSmallBoardWinner(gameState.board[boardIndex])) {
        gameState.boardWinners[boardIndex] = symbol;
    }

    // Set next board - player must play in the board corresponding to the cell they just played
    gameState.nextBoard = cellIndex;

    // If next board is already won or full, allow free choice
    if (gameState.boardWinners[gameState.nextBoard] !== null || isBoardFull(gameState.board[gameState.nextBoard])) {
        gameState.nextBoard = null;
    }

    return true;
}

// Update display
function updateDisplay() {
    const currentPlayerName = gameState.playerNames[gameState.currentPlayer];
    const symbol = gameState.currentPlayer === 0 ? 'X' : 'O';

    // Update current player display with styling
    currentPlayerDisplay.innerHTML = `
        <span style="font-weight: 600;">${currentPlayerName}</span>
        <span style="opacity: 0.8;">(${symbol})</span>
    `;

    // Ensure current-turn class is applied
    currentPlayerDisplay.className = 'player-info current-turn';

    if (gameState.nextBoard === null) {
        nextBoardInfo.textContent = 'Play anywhere on the board';
    } else {
        nextBoardInfo.textContent = `Must play in board ${gameState.nextBoard + 1}`;
    }
}

// Check if a small board has a winner
function checkSmallBoardWinner(board) {
    const winPatterns = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
        [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
        [0, 4, 8], [2, 4, 6] // diagonals
    ];

    for (const pattern of winPatterns) {
        const [a, b, c] = pattern;
        if (board[a] && board[a] === board[b] && board[a] === board[c]) {
            return board[a];
        }
    }
    return null;
}

// Check if a board is full
function isBoardFull(board) {
    return board.every(cell => cell !== null);
}

// Check for overall winner
function checkOverallWinner() {
    return checkSmallBoardWinner(gameState.boardWinners);
}

// Status message display
function showStatus(message, type = 'info') {
    statusDiv.textContent = message;
    statusDiv.className = `status ${type}`;
    statusDiv.style.display = 'block';

    // Auto-hide success messages after 3 seconds, errors stay longer
    if (type === 'success') {
        setTimeout(() => {
            statusDiv.style.display = 'none';
        }, 3000);
    } else if (type !== 'error') {
        setTimeout(() => {
            statusDiv.style.display = 'none';
        }, 5000);
    }
}

// Event listeners
newGameBtn.addEventListener('click', () => {
    if (confirm('Start a new game?')) {
        initGame();
    }
});

backToMenuBtn.addEventListener('click', () => {
    if (confirm('Return to main menu?')) {
        window.location.href = '/';
    }
});

// Initialize the game
initGame();
