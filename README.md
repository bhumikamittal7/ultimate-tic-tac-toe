# Ultimate Tic-Tac-Toe

A modern, real-time multiplayer implementation of Ultimate Tic-Tac-Toe (also known as Tic-Tac-Toe² or Meta Tic-Tac-Toe).

## How to Play

Ultimate Tic-Tac-Toe adds strategic depth to the classic game:

1. **The Board**: 9 smaller 3×3 tic-tac-toe boards arranged in a 3×3 grid
2. **Your Move**: When you play in a small board, your opponent must play in the board corresponding to your move's position
3. **Win Small Boards**: Get three-in-a-row in any small board to claim it
4. **Win the Game**: Get three claimed boards in a row to win the overall game
5. **Free Choice**: If sent to a won or full board, you can play anywhere!

## Features

- 🎮 Clean, modern web interface
- 👥 Real-time multiplayer with WebSocket
- 🔗 Shareable room links for inviting friends
- 📱 Responsive design works on mobile and desktop
- ⚡ Instant game state synchronization

## Local Development

### Prerequisites
- Node.js 14+ and npm

### Installation
```bash
# Clone or download the project
cd ultimate-tic-tac-toe

# Install dependencies
npm install

# Start the server
npm start
```

The game will be available at `http://localhost:3000`

## Hosting Options

### Option 1: Heroku (Free)
1. Create a Heroku account at https://heroku.com
2. Install Heroku CLI: `npm install -g heroku`
3. Login: `heroku login`
4. Create app: `heroku create your-app-name`
5. Deploy: `git push heroku main`

### Option 2: Railway (Free)
1. Go to https://railway.app
2. Connect your GitHub repository
3. Railway will auto-detect Node.js and deploy

### Option 3: Vercel (Free)
1. Go to https://vercel.com
2. Import your project
3. Add environment variable: `PORT=3000`
4. Deploy

### Option 4: DigitalOcean App Platform
1. Go to https://cloud.digitalocean.com/apps
2. Create new app from source code
3. Connect repository or upload files
4. Configure as Node.js application

### Option 5: AWS/GCP/Azure
For production deployments, use their app hosting services.

## How to Share with Friends

1. **Create a Room**: Click "Create New Room" to get a unique room code
2. **Share the Link**: Copy the invite link and send it to your friend
3. **Join via URL**: Friends can join directly using the shared link
4. **Play**: The game starts automatically when both players join

## Game Rules in Detail

### Basic Rules
- Players take turns placing X's and O's
- First player is X, second player is O

### Ultimate Rules
- After a player plays in position (board, cell), the next player must play in board = cell
- Example: If you play in board 4, cell 7, next player plays in board 7
- If the target board is already won or full, the player can choose any available board
- Win a small board by getting 3-in-a-row (horizontal, vertical, or diagonal)
- Win the game by getting 3 small board wins in a row

### Board Numbering
```
0 1 2
3 4 5
6 7 8
```

## Technical Details

- **Backend**: Node.js + Express + Socket.IO
- **Frontend**: Vanilla JavaScript + HTML + CSS
- **Real-time**: WebSocket connections for multiplayer
- **State Management**: Server-side game state with client synchronization

## Contributing

Feel free to submit issues and enhancement requests!

## License

MIT License - feel free to use this code for your own projects.
