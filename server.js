const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Serve static files from public directory
app.use(express.static('public'));

// Store active games and rooms
const games = new Map();
const rooms = new Map();

// Routes
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

app.get('/local-game.html', (req, res) => {
  res.sendFile(__dirname + '/public/local-game.html');
});

app.get('/room/:roomId', (req, res) => {
  res.sendFile(__dirname + '/public/game.html');
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Create new room
  socket.on('create-room', (callback) => {
    const roomId = uuidv4().substring(0, 8);
    const room = {
      id: roomId,
      players: [socket.id],
      gameState: null,
      status: 'waiting' // waiting, playing, finished
    };

    rooms.set(roomId, room);
    socket.join(roomId);
    callback({ roomId, success: true });
    console.log(`Room created: ${roomId}`);
  });

  // Join existing room (or create if doesn't exist)
  socket.on('join-room', (roomId, callback) => {
    let room = rooms.get(roomId);

    // If room doesn't exist, create it
    if (!room) {
      room = {
        id: roomId,
        players: [],
        gameState: null,
        status: 'waiting'
      };
      rooms.set(roomId, room);
      console.log(`Room created: ${roomId}`);
    }

    if (room.players.length >= 2) {
      callback({ success: false, message: 'Room is full' });
      return;
    }

    // Check if player is already in the room
    if (!room.players.includes(socket.id)) {
      room.players.push(socket.id);
      socket.join(roomId);
    }

    if (room.players.length === 2) {
      room.status = 'playing';
      // Start the game
      startGame(roomId);
    }

    callback({ success: true, playerCount: room.players.length });
    console.log(`Player joined room: ${roomId} (${room.players.length}/2 players)`);
  });

  // Handle game moves
  socket.on('make-move', (data) => {
    const { roomId, boardIndex, cellIndex } = data;
    const room = rooms.get(roomId);

    if (!room || room.status !== 'playing') return;

    const game = games.get(roomId);
    if (!game) return;

    // Check if it's the player's turn
    const currentPlayer = room.players[game.currentPlayer];
    if (socket.id !== currentPlayer) return;

    // Make the move
    const success = makeMove(game, boardIndex, cellIndex);
    if (success) {
      // Switch turns
      game.currentPlayer = 1 - game.currentPlayer;

      // Broadcast updated game state
      io.to(roomId).emit('game-update', {
        board: game.board,
        currentPlayer: game.currentPlayer,
        nextBoard: game.nextBoard,
        winner: game.winner,
        boardWinners: game.boardWinners
      });

      // Check for overall winner
      const overallWinner = checkOverallWinner(game);
      if (overallWinner) {
        room.status = 'finished';
        io.to(roomId).emit('game-over', { winner: overallWinner });
      }
    }
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);

    // Find and clean up rooms
    for (const [roomId, room] of rooms.entries()) {
      const playerIndex = room.players.indexOf(socket.id);
      if (playerIndex !== -1) {
        room.players.splice(playerIndex, 1);

        if (room.players.length === 0) {
          rooms.delete(roomId);
          games.delete(roomId);
        } else {
          // Notify remaining player
          io.to(roomId).emit('player-disconnected');
          room.status = 'waiting';
        }
        break;
      }
    }
  });
});

function startGame(roomId) {
  const game = {
    board: Array(9).fill().map(() => Array(9).fill(null)), // 9x9 board
    boardWinners: Array(9).fill(null), // winners of each small board
    currentPlayer: 0, // 0 for X, 1 for O
    nextBoard: null, // which board the next player must play in
    winner: null
  };

  games.set(roomId, game);

  const room = rooms.get(roomId);
  io.to(roomId).emit('game-started', {
    players: room.players,
    yourTurn: room.players[0] === room.players[0] // first player goes first
  });

  io.to(roomId).emit('game-update', {
    board: game.board,
    currentPlayer: game.currentPlayer,
    nextBoard: game.nextBoard,
    winner: game.winner,
    boardWinners: game.boardWinners
  });
}

function makeMove(game, boardIndex, cellIndex) {
  // Check if move is valid
  if (game.nextBoard !== null && game.nextBoard !== boardIndex) {
    return false; // Must play in the specified board
  }

  if (game.board[boardIndex][cellIndex] !== null) {
    return false; // Cell already occupied
  }

  if (game.boardWinners[boardIndex] !== null) {
    return false; // Board already won
  }

  // Make the move
  game.board[boardIndex][cellIndex] = game.currentPlayer === 0 ? 'X' : 'O';

  // Check if this move wins the small board
  if (checkSmallBoardWinner(game.board[boardIndex])) {
    game.boardWinners[boardIndex] = game.currentPlayer === 0 ? 'X' : 'O';
  }

  // Set next board - player must play in the board corresponding to the cell they just played
  game.nextBoard = cellIndex;

  // If next board is already won or full, allow free choice
  if (game.boardWinners[game.nextBoard] !== null || isBoardFull(game.board[game.nextBoard])) {
    game.nextBoard = null;
  }

  return true;
}

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

function isBoardFull(board) {
  return board.every(cell => cell !== null);
}

function checkOverallWinner(game) {
  return checkSmallBoardWinner(game.boardWinners);
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Access at: http://localhost:${PORT}`);
});
