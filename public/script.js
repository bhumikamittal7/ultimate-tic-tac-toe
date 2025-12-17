// DOM Elements
const startLocalBtn = document.getElementById('start-local-btn');
const player1NameInput = document.getElementById('player1-name');
const player2NameInput = document.getElementById('player2-name');
const statusDiv = document.getElementById('status');

// Local multiplayer functionality
startLocalBtn.addEventListener('click', () => {
    const player1Name = player1NameInput.value.trim() || 'Player 1';
    const player2Name = player2NameInput.value.trim() || 'Player 2';

    if (!player1Name || !player2Name) {
        showStatus('Please enter names for both players', 'error');
        return;
    }

    // Store player names in localStorage for the game
    localStorage.setItem('player1Name', player1Name);
    localStorage.setItem('player2Name', player2Name);
    localStorage.setItem('gameMode', 'local');

    // Redirect to local game
    window.location.href = '/local-game.html';
});

// Allow pressing Enter in inputs
roomCodeInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        joinRoomBtn.click();
    }
});

player1NameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        player2NameInput.focus();
    }
});

player2NameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        localPlayBtn.click();
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

// Auto-focus room code input if URL has room parameter
const urlParams = new URLSearchParams(window.location.search);
const roomParam = urlParams.get('room');
if (roomParam) {
    roomCodeInput.value = roomParam;
    joinRoomBtn.click();
}
