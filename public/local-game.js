// Get player names and game mode from localStorage
const player1Name = localStorage.getItem('player1Name') || 'Player 1';
const player2Name = localStorage.getItem('player2Name') || 'Player 2';
const gameMode = localStorage.getItem('gameMode') || 'local';
const botDifficulty = localStorage.getItem('botDifficulty') || 'easy';

// Bot configuration
const isBotGame = gameMode === 'bot';
const botPlayerIndex = player2Name === 'AI Bot' ? 1 : 0; // Bot is always player 2 (O)
const humanPlayerIndex = 1 - botPlayerIndex;

// Bot win probabilities (chance to make optimal moves)
const botWinChances = {
    easy: 0.5,       // 50% chance to win/draw
    medium: 0.75,    // 75% chance to win/draw
    hard: 0.95,      // 95% chance to win/draw
    impossible: 1.0  // 100% chance - always optimal
};

// DOM elements
const gameBoard = document.getElementById('game-board');
const currentPlayerDisplay = document.getElementById('current-player-display');
const nextBoardInfo = document.getElementById('next-board-info');
const statusDiv = document.getElementById('status');
const winModal = document.getElementById('win-modal');
const winTitle = document.getElementById('win-title');
const winMessage = document.getElementById('win-message');
const newGameBtn = document.getElementById('new-game-btn');
const backToMenuBtn = document.getElementById('back-to-menu-btn');
const playAgainBtn = document.getElementById('play-again-btn');

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
        winningCombination: null,
        playerNames: [player1Name, player2Name]
    };
    winModal.classList.add('hidden');
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
            // Create overlay with winning symbol
            const overlay = document.createElement('div');
            overlay.className = 'board-overlay';
            overlay.textContent = gameState.boardWinners[boardIndex];
            overlay.classList.add(gameState.boardWinners[boardIndex].toLowerCase());
            board.appendChild(overlay);
        }

        // Highlight winning combination
        if (gameState.winningCombination && gameState.winningCombination.includes(boardIndex)) {
            board.classList.add('winning-line');
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

    // Only allow human moves during their turn
    if (isBotGame && gameState.currentPlayer === botPlayerIndex) {
        return; // Bot's turn, don't allow human input
    }

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
            showWinModal(overallWinner);
        } else {
            // Check for tie (all boards are won but no overall winner)
            const allBoardsWon = gameState.boardWinners.every(winner => winner !== null);
            if (allBoardsWon) {
                gameState.winner = 'tie';
                showWinModal('tie');
            } else {
                updateDisplay();

                // If it's bot's turn, make bot move after a delay
                if (isBotGame && gameState.currentPlayer === botPlayerIndex) {
                    setTimeout(makeBotMove, 800); // 800ms delay for bot move
                }
            }
        }
    }
}

// Bot move logic
function makeBotMove() {
    if (gameState.winner) return; // Game already over

    const winChance = botWinChances[botDifficulty];
    const botMove = calculateBotMove(winChance);

    if (botMove) {
        const { boardIndex, cellIndex } = botMove;

        if (makeMove(boardIndex, cellIndex)) {
            // Re-render the board to show the bot move
            renderBoard();

            // Switch turns back to human
            gameState.currentPlayer = 1 - gameState.currentPlayer;

            // Check for overall winner
            const overallWinner = checkOverallWinner();
            if (overallWinner) {
                gameState.winner = overallWinner;
                showWinModal(overallWinner);
            } else {
                // Check for tie (all boards are won but no overall winner)
                const allBoardsWon = gameState.boardWinners.every(winner => winner !== null);
                if (allBoardsWon) {
                    gameState.winner = 'tie';
                    showWinModal('tie');
                } else {
                    updateDisplay();
                }
            }
        }
    }
}

// Calculate bot move based on difficulty
function calculateBotMove(winChance) {
    const possibleMoves = getPossibleMoves();

    if (possibleMoves.length === 0) return null;

    // For impossible mode, always make strategic moves
    if (botDifficulty === 'impossible' || Math.random() < winChance) {
        // Make strategic move
        return getBestMove(possibleMoves);
    } else {
        // Make random move
        return possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
    }
}

// Get all possible moves
function getPossibleMoves() {
    const moves = [];

    for (let boardIndex = 0; boardIndex < 9; boardIndex++) {
        // Check if we can play in this board
        const canPlayInBoard = gameState.nextBoard === null || gameState.nextBoard === boardIndex;
        if (!canPlayInBoard || gameState.boardWinners[boardIndex]) continue;

        for (let cellIndex = 0; cellIndex < 9; cellIndex++) {
            if (!gameState.board[boardIndex][cellIndex]) {
                moves.push({ boardIndex, cellIndex });
            }
        }
    }

    return moves;
}

// Get the best strategic move (advanced AI)
function getBestMove(possibleMoves) {
    // Priority 1: Win the current small board if possible
    for (const move of possibleMoves) {
        const testBoard = gameState.board[move.boardIndex].slice();
        testBoard[move.cellIndex] = 'O'; // Bot is O

        if (checkSmallBoardWinner(testBoard) === 'O') {
            return move; // Winning move
        }
    }

    // Priority 2: Block human from winning small board
    for (const move of possibleMoves) {
        const testBoard = gameState.board[move.boardIndex].slice();
        testBoard[move.cellIndex] = 'X'; // Human is X

        if (checkSmallBoardWinner(testBoard) === 'X') {
            return move; // Blocking move
        }
    }

    // Priority 3: Try to set up future wins (for impossible mode)
    if (botDifficulty === 'impossible') {
        // Check if this move creates a fork (two ways to win)
        for (const move of possibleMoves) {
            const testBoard = gameState.board[move.boardIndex].slice();
            testBoard[move.cellIndex] = 'O';

            // Count potential winning lines created by this move
            let winningLines = 0;
            const lines = [
                [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
                [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
                [0, 4, 8], [2, 4, 6] // diagonals
            ];

            for (const line of lines) {
                const [a, b, c] = line;
                const lineValues = [testBoard[a], testBoard[b], testBoard[c]];
                const botCount = lineValues.filter(val => val === 'O').length;
                const emptyCount = lineValues.filter(val => val === null).length;

                if (botCount === 2 && emptyCount === 1) {
                    winningLines++;
                }
            }

            if (winningLines >= 2) {
                return move; // Fork move!
            }
        }
    }

    // Priority 4: Prefer center of board
    const centerMoves = possibleMoves.filter(move => move.cellIndex === 4);
    if (centerMoves.length > 0) {
        return centerMoves[0];
    }

    // Priority 5: Prefer corner moves (strategic positions)
    const cornerMoves = possibleMoves.filter(move =>
        [0, 2, 6, 8].includes(move.cellIndex)
    );
    if (cornerMoves.length > 0) {
        return cornerMoves[Math.floor(Math.random() * cornerMoves.length)];
    }

    // Priority 6: Avoid moves that help opponent
    if (botDifficulty === 'impossible') {
        // Filter out moves that would give opponent a winning opportunity
        const safeMoves = possibleMoves.filter(move => {
            const testBoard = gameState.board[move.boardIndex].slice();
            testBoard[move.cellIndex] = 'X'; // Simulate opponent move

            // Check if this creates a dangerous position for opponent
            const lines = [
                [0, 1, 2], [3, 4, 5], [6, 7, 8],
                [0, 3, 6], [1, 4, 7], [2, 5, 8],
                [0, 4, 8], [2, 4, 6]
            ];

            for (const line of lines) {
                const [a, b, c] = line;
                const lineValues = [testBoard[a], testBoard[b], testBoard[c]];
                const xCount = lineValues.filter(val => val === 'X').length;
                const emptyCount = lineValues.filter(val => val === null).length;

                if (xCount === 2 && emptyCount === 1) {
                    return false; // This would create a winning opportunity for opponent
                }
            }
            return true;
        });

        if (safeMoves.length > 0) {
            possibleMoves = safeMoves;
        }
    }

    // Fallback: Random move from remaining options
    return possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
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

// Check for overall winner and return winning info
function checkOverallWinner() {
    const winner = checkSmallBoardWinner(gameState.boardWinners);
    if (winner) {
        // Find the winning combination
        gameState.winningCombination = findWinningCombination(gameState.boardWinners, winner);
    }
    return winner;
}

// Find which boards form the winning combination
function findWinningCombination(boardWinners, winner) {
    const winPatterns = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
        [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
        [0, 4, 8], [2, 4, 6] // diagonals
    ];

    for (const pattern of winPatterns) {
        const [a, b, c] = pattern;
        if (boardWinners[a] === winner && boardWinners[b] === winner && boardWinners[c] === winner) {
            return pattern;
        }
    }
    return null;
}

// Show win modal
function showWinModal(winner) {
    const winnerName = gameState.playerNames[winner === 'X' ? 0 : 1];
    const isBotWinner = (winner === 'O' && isBotGame);

    if (winner === 'tie') {
        winTitle.textContent = "It's a Tie!";
        winMessage.textContent = "Great game! Both players played well.";
    } else if (isBotWinner) {
        winTitle.textContent = "Bot Wins!";
        winMessage.textContent = "The AI was too strong this time. Try again!";
    } else {
        winTitle.textContent = `${winnerName} Wins!`;
        winMessage.textContent = `Congratulations ${winnerName}! You won the Ultimate Tic-Tac-Toe game.`;
    }

    winModal.classList.remove('hidden');
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

playAgainBtn.addEventListener('click', () => {
    winModal.classList.add('hidden');
    initGame();
});

backToMenuBtn.addEventListener('click', () => {
    if (confirm('Return to main menu?')) {
        window.location.href = '/';
    }
});

// Initialize the game
initGame();

// If bot goes first, make the first move
if (isBotGame && gameState.currentPlayer === botPlayerIndex) {
    setTimeout(makeBotMove, 1000); // Delay for dramatic effect
}
