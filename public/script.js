// DOM Elements
// Tabs
const localTab = document.getElementById('local-tab');
const botTab = document.getElementById('bot-tab');
const localSection = document.getElementById('local-section');
const botSection = document.getElementById('bot-section');

// Local multiplayer
const startLocalBtn = document.getElementById('start-local-btn');
const player1NameInput = document.getElementById('player1-name');
const player2NameInput = document.getElementById('player2-name');

// Bot game
const startBotBtn = document.getElementById('start-bot-btn');
const humanNameInput = document.getElementById('human-name');
const difficultyBtns = document.querySelectorAll('.difficulty-btn');

const statusDiv = document.getElementById('status');

// Current difficulty
let selectedDifficulty = 'easy';

// Tab switching
localTab.addEventListener('click', () => {
    localTab.classList.add('active');
    botTab.classList.remove('active');
    localSection.classList.remove('hidden');
    botSection.classList.add('hidden');
});

botTab.addEventListener('click', () => {
    botTab.classList.add('active');
    localTab.classList.remove('active');
    botSection.classList.remove('hidden');
    localSection.classList.add('hidden');
});

// Difficulty selection
difficultyBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        difficultyBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedDifficulty = btn.dataset.difficulty;
    });
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

// Bot game functionality
startBotBtn.addEventListener('click', () => {
    const humanName = humanNameInput.value.trim() || 'Player';

    if (!humanName) {
        showStatus('Please enter your name', 'error');
        return;
    }

    // Store player names and bot settings in localStorage for the game
    localStorage.setItem('player1Name', humanName);
    localStorage.setItem('player2Name', 'AI Bot');
    localStorage.setItem('gameMode', 'bot');
    localStorage.setItem('botDifficulty', selectedDifficulty);

    // Redirect to bot game
    window.location.href = '/local-game.html';
});

// Allow pressing Enter in inputs
player1NameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        player2NameInput.focus();
    }
});

player2NameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        startLocalBtn.click();
    }
});

humanNameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        startBotBtn.click();
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
