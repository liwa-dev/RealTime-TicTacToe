import { showNotification } from './notification.js';

const socket = io();

const createRoomBtn = document.getElementById('create-room');
const joinRoomBtn = document.getElementById('join-room');
const roomIdInput = document.getElementById('room-id');
const gameBoard = document.getElementById('game-board');
const cells = document.querySelectorAll('.cell');
const status = document.getElementById('status');
const gameStartOverlay = document.getElementById('game-start-overlay');
const gameEndOverlay = document.getElementById('game-end-overlay');
const resetGameBtn = document.getElementById('reset-game');
const timerElement = document.getElementById('timer');
const matchDurationElement = document.getElementById('match-duration');

let timerInterval;
let startTime;
let roomId = null;
let player = null;
let isHost = false;
let gameState = 'waiting';
let currentTurn = null;

let canCreateRoom = true;
const ROOM_CREATE_COOLDOWN = 5000; // 5 seconds cooldown

createRoomBtn.addEventListener('click', () => {
  if (canCreateRoom) {
    socket.emit('createRoom');
    canCreateRoom = false;
    createRoomBtn.disabled = true;
    setTimeout(() => {
      canCreateRoom = true;
      createRoomBtn.disabled = false;
    }, ROOM_CREATE_COOLDOWN);
  }
});

joinRoomBtn.addEventListener('click', () => {
  const id = roomIdInput.value;
  if (id) {
    socket.emit('joinRoom', id);
  }
});

cells.forEach(cell => {
  cell.addEventListener('click', () => {
    if (roomId && player && cell.textContent === '' && gameState === 'playing' && currentTurn === socket.id) {
      const index = cell.dataset.index;
      socket.emit('makeMove', { roomId, index, player });
    }
  });
});

resetGameBtn.addEventListener('click', () => {
  if (isHost && gameState === 'ended') {
    socket.emit('resetGame', roomId);
  } else if (!isHost) {
    showNotification('You are not the host of this game.', 'failed');
  } else {
    showNotification('The game cannot be reset at this time.', 'info');
  }
});

socket.on('roomCreated', ({ roomId: id, isHost: hostStatus }) => {
  roomId = id;
  isHost = hostStatus;
  status.textContent = `Room created. Room ID: ${id}`;
  showNotification('Room created successfully!', 'success');
  updateResetButton();
});

socket.on('gameStart', ({ roomId: id, players, board, currentTurn: turn, startTime: serverStartTime, isHost: hostStatus }) => {
  roomId = id;
  player = socket.id === players[0] ? 'X' : 'O';
  currentTurn = turn;
  isHost = hostStatus;
  gameBoard.classList.remove('hidden');
  updateStatus();
  gameStartOverlay.classList.remove('hidden');
  startTime = serverStartTime;
  startTimer();
  gameStartOverlay.classList.add('show');
  setTimeout(() => gameStartOverlay.classList.remove('show'), 2000);
  gameState = 'playing';
  updateResetButton();
  updateBoard(board);
});

socket.on('playerRejoined', ({ roomId: id, players, board, currentTurn: turn, startTime: serverStartTime, isHost: hostStatus }) => {
  roomId = id;
  player = socket.id === players[0] ? 'X' : 'O';
  currentTurn = turn;
  isHost = hostStatus;
  gameState = 'playing';
  updateStatus();
  showNotification('Player rejoined. Game restarted.', 'info');
  updateResetButton();
  updateBoard(board);
  startTime = serverStartTime;
  resetTimer();
  startTimer();
});

socket.on('moveMade', ({ index, player: movePlayer, currentTurn: turn }) => {
  const cell = cells[index];
  cell.classList.add(movePlayer.toLowerCase());
  cell.setAttribute('data-content', movePlayer);
  currentTurn = turn;
  updateStatus();
});

socket.on('gameOver', ({ winner, isHost: hostStatus }) => {
  gameState = 'ended';
  isHost = hostStatus; // Ensure this line is present
  stopTimer();
  if (winner === 'draw') {
    status.textContent = "Game over. It's a draw!";
    showNotification("It's a draw!", 'info');
  } else {
    status.textContent = `Game over. ${winner === player ? 'You win!' : 'You lose!'}`;
    showNotification(winner === player ? 'You win!' : 'You lose!', winner === player ? 'success' : 'failed');
  }
  updateResetButton(); // Ensure this line is present
});

socket.on('gameReset', (roomData) => {
  resetGame(roomData);
  showNotification('Game has been reset.', 'info');
});

socket.on('resetError', (errorMessage) => {
  showNotification(errorMessage, 'failed');
});




socket.on('joinError', (message) => {
  status.textContent = message;
  showNotification(message, 'failed');
});

socket.on('playerLeft', ({ isHost: newHostStatus }) => {
  gameState = 'waiting';
  status.textContent = 'Waiting for other player to rejoin...';
  showNotification('The other player has left the game.', 'info');
  isHost = newHostStatus;
  updateResetButton();
  stopTimer();
});


function startTimer() {
  clearInterval(timerInterval);
  timerInterval = setInterval(updateTimer, 1000);
}

function updateTimer() {
  const elapsedTime = Math.floor((Date.now() - startTime) / 1000);
  const minutes = Math.floor(elapsedTime / 60).toString().padStart(2, '0');
  const seconds = (elapsedTime % 60).toString().padStart(2, '0');
  timerElement.textContent = `Time: ${minutes}:${seconds}`;
}

function stopTimer() {
  clearInterval(timerInterval);
  const duration = Math.floor((Date.now() - startTime) / 1000);
  const minutes = Math.floor(duration / 60).toString().padStart(2, '0');
  const seconds = (duration % 60).toString().padStart(2, '0');
  matchDurationElement.textContent = `Match duration: ${minutes}:${seconds}`;
}

function resetTimer() {
  clearInterval(timerInterval);
  timerElement.textContent = 'Time: 00:00';
  matchDurationElement.textContent = '';
}

function updateStatus() {
  if (currentTurn === socket.id) {
    status.textContent = `Your turn (${player})`;
  } else {
    status.textContent = `Opponent's turn (${player === 'X' ? 'O' : 'X'})`;
  }
}

function updateBoard(board) {
  cells.forEach((cell, index) => {
    cell.textContent = board[index] || '';
    cell.classList.remove('x', 'o');
    if (board[index]) {
      cell.classList.add(board[index].toLowerCase());
      cell.setAttribute('data-content', board[index]);
    } else {
      cell.removeAttribute('data-content');
    }
  });
  updateStatus();
}

function resetGame(roomData) {
  cells.forEach(cell => {
    cell.textContent = '';
    cell.classList.remove('x', 'o');
    cell.removeAttribute('data-content');
  });

  roomId = roomData.roomId;
  player = socket.id === roomData.players[0] ? 'X' : 'O';
  currentTurn = roomData.currentTurn;
  gameState = roomData.gameState;
  isHost = roomData.isHost;

  startTime = roomData.startTime;
  resetTimer();
  startTimer();

  gameBoard.classList.remove('hidden');
  updateStatus();
  gameStartOverlay.classList.remove('hidden');
  gameStartOverlay.classList.add('show');
  setTimeout(() => gameStartOverlay.classList.remove('show'), 2000);
  
  updateResetButton();
  updateBoard(roomData.board);
}


function updateResetButton() {
  if (gameState === 'ended') {
    resetGameBtn.classList.remove('hidden');
    resetGameBtn.disabled = !isHost;
    resetGameBtn.title = isHost ? 'Reset the game' : 'Only the host can reset the game';
  } else {
    resetGameBtn.classList.add('hidden');
  }
}


function logGameState() {
  console.log('Current game state:', {
    isHost,
    gameState,
    player,
    roomId
  });
}



gameStartOverlay.addEventListener('animationend', (event) => {
  if (event.animationName === 'fadeOut') {
    gameStartOverlay.classList.add('hidden');
  }
});

gameEndOverlay.addEventListener('animationend', (event) => {
  if (event.animationName === 'fadeOut') {
    gameEndOverlay.classList.add('hidden');
  }
});