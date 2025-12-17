// DOM Elements
const socket = io();
const localModeBtn = document.getElementById('local-mode-btn');
const onlineModeBtn = document.getElementById('online-mode-btn');
const localSetup = document.getElementById('local-setup');
const onlineSetup = document.getElementById('online-setup');

// Local multiplayer elements
const startLocalBtn = document.getElementById('start-local-btn');
const player1NameInput = document.getElementById('player1-name');
const player2NameInput = document.getElementById('player2-name');

// Online multiplayer elements
const createRoomBtn = document.getElementById('create-room-btn');
const joinRoomBtn = document.getElementById('join-room-btn');
const roomCodeInput = document.getElementById('room-code');
const onlinePlayerNameInput = document.getElementById('online-player-name');

const statusDiv = document.getElementById('status');

// Set up socket connection
socket.on('connect', () => {
    console.log('Connected to server');
});

// Mode switching
localModeBtn.addEventListener('click', () => {
    localModeBtn.classList.add('active');
    onlineModeBtn.classList.remove('active');
    localSetup.classList.remove('hidden');
    onlineSetup.classList.add('hidden');
});

onlineModeBtn.addEventListener('click', () => {
    onlineModeBtn.classList.add('active');
    localModeBtn.classList.remove('active');
    onlineSetup.classList.remove('hidden');
    localSetup.classList.add('hidden');
});

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

// Online multiplayer functionality
createRoomBtn.addEventListener('click', () => {
    const playerName = onlinePlayerNameInput.value.trim();
    if (!playerName) {
        showStatus('Please enter your name', 'error');
        return;
    }

    // Store player name for the online game
    localStorage.setItem('onlinePlayerName', playerName);

    // Set player name on server
    socket.emit('set-player-name', playerName);

    socket.emit('create-room', (response) => {
        if (response.success) {
            // Redirect to the game room
            window.location.href = `/room/${response.roomId}`;
        } else {
            showStatus('Failed to create room', 'error');
        }
    });
});

joinRoomBtn.addEventListener('click', () => {
    const roomId = roomCodeInput.value.trim().toLowerCase();
    const playerName = onlinePlayerNameInput.value.trim();

    if (!playerName) {
        showStatus('Please enter your name', 'error');
        return;
    }

    if (!roomId) {
        showStatus('Please enter a room code', 'error');
        return;
    }

    // Store player name for the online game
    localStorage.setItem('onlinePlayerName', playerName);

    // Set player name on server
    socket.emit('set-player-name', playerName);

    socket.emit('join-room', roomId, (response) => {
        if (response.success) {
            // Redirect to the game room
            window.location.href = `/room/${roomId}`;
        } else {
            showStatus(response.message, 'error');
        }
    });
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
