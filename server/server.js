const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static(path.join(__dirname, '../client/public')));

let rooms = {};

io.on('connection', (socket) => {
  console.log('New client connected');
  
  socket.on('createRoom', () => {
    const roomId = Math.random().toString(36).substring(2, 8);
    rooms[roomId] = { 
      players: [socket.id], 
      board: Array(9).fill(null),
      host: socket.id,
      gameState: 'waiting',
      currentTurn: socket.id,
      startTime: null
    };
    socket.join(roomId);
    socket.emit('roomCreated', { roomId, isHost: true });
  });

  socket.on('joinRoom', (roomId) => {
    if (rooms[roomId]) {
      if (rooms[roomId].players.includes(socket.id)) {
        return socket.emit('joinError', 'You are already in this room');
      }
      if (rooms[roomId].players.length < 2) {
        rooms[roomId].players.push(socket.id);
        socket.join(roomId);
        resetRoom(roomId);
        io.to(roomId).emit('gameStart', {
          ...getRoomData(roomId),
          isHost: socket.id === rooms[roomId].host
        });
      } else {
        socket.emit('joinError', 'Room is full');
      }
    } else {
      socket.emit('joinError', 'Room does not exist');
    }
  });
  

  socket.on('makeMove', ({ roomId, index, player }) => {
    if (rooms[roomId] && rooms[roomId].board[index] === null && 
        rooms[roomId].gameState === 'playing' && 
        rooms[roomId].currentTurn === socket.id) {
      rooms[roomId].board[index] = player;
      rooms[roomId].currentTurn = rooms[roomId].players.find(id => id !== socket.id);
      io.to(roomId).emit('moveMade', { index, player, currentTurn: rooms[roomId].currentTurn });
      
      const winner = checkWinner(rooms[roomId].board);
      if (winner) {
        rooms[roomId].gameState = 'ended';
        io.to(roomId).emit('gameOver', {
          winner,
          isHost: socket.id === rooms[roomId].host
        });
      } else if (!rooms[roomId].board.includes(null)) {
        rooms[roomId].gameState = 'ended';
        io.to(roomId).emit('gameOver', {
          winner: 'draw',
          isHost: socket.id === rooms[roomId].host
        });
      }
    }
  });

  socket.on('resetGame', (roomId) => {
    if (rooms[roomId] && socket.id === rooms[roomId].host && rooms[roomId].gameState === 'ended') {
      if (rooms[roomId].players.length === 2) {
        resetRoom(roomId);
        io.to(roomId).emit('gameReset', getRoomData(roomId));
      } else {
        socket.emit('resetError', 'Both players must be in the room to reset the game.');
      }
    } else if (rooms[roomId] && socket.id !== rooms[roomId].host) {
      socket.emit('resetError', 'You are not the host of this game.');
    } else {
      socket.emit('resetError', 'You are not the host of this game.');
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
    for (const roomId in rooms) {
      const room = rooms[roomId];
      const playerIndex = room.players.indexOf(socket.id);
      if (playerIndex !== -1) {
        room.players.splice(playerIndex, 1);
        if (room.players.length === 0) {
          delete rooms[roomId];
        } else {
          if (socket.id === room.host) {
            room.host = room.players[0];
          }
          io.to(roomId).emit('playerLeft', {
            ...getRoomData(roomId),
            isHost: socket.id === room.host
          });
          room.gameState = 'waiting';
        }
        break;
      }
    }
  });
  

});

function resetRoom(roomId) {
  rooms[roomId].board = Array(9).fill(null);
  rooms[roomId].gameState = 'playing';
  rooms[roomId].currentTurn = rooms[roomId].players[0];
  rooms[roomId].startTime = Date.now();
}

function getRoomData(roomId) {
  return {
    roomId,
    players: rooms[roomId].players,
    board: rooms[roomId].board,
    currentTurn: rooms[roomId].currentTurn,
    startTime: rooms[roomId].startTime,
    gameState: rooms[roomId].gameState,
    isHost: rooms[roomId].host // Change this to just send the host ID
  };
}

function checkWinner(board) {
  const lines = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
    [0, 4, 8], [2, 4, 6] // Diagonals
  ];

  for (let line of lines) {
    const [a, b, c] = line;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a];
    }
  }
  return null;
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));