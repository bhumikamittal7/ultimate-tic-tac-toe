const socket = io();
const createRoomBtn = document.getElementById('create-room-btn');
const joinRoomBtn = document.getElementById('join-room-btn');
const roomCodeInput = document.getElementById('room-code');
const statusDiv = document.getElementById('status');

// Create room functionality
createRoomBtn.addEventListener('click', () => {
    socket.emit('create-room', (response) => {
        if (response.success) {
            // Redirect to the game room
            window.location.href = `/room/${response.roomId}`;
        } else {
            showStatus('Failed to create room', 'error');
        }
    });
});

// Join room functionality
joinRoomBtn.addEventListener('click', () => {
    const roomId = roomCodeInput.value.trim().toLowerCase();
    if (!roomId) {
        showStatus('Please enter a room code', 'error');
        return;
    }

    socket.emit('join-room', roomId, (response) => {
        if (response.success) {
            // Redirect to the game room
            window.location.href = `/room/${roomId}`;
        } else {
            showStatus(response.message, 'error');
        }
    });
});

// Allow pressing Enter in room code input
roomCodeInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        joinRoomBtn.click();
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
