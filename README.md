# RealTime-TicTacToe

I created a real-time multiplayer Tic-Tac-Toe game built with Node.js and Socket.IO

![Project Logo](public/client/Untitled.png)


## Table of Contents

- [Introduction](#introduction)
- [Features](#features)
- [Installation](#installation)
- [Usage](#usage)
- [Project Structure](#project-structure)
- [Server-Client Communication](#server-client-communication)
- [Contributing](#contributing)
- [License](#license)

## Introduction

RealTime-TicTacToe is a real-time multiplayer Tic-Tac-Toe game that allows players to compete against each other over the internet. The game is built using Node.js for the server-side logic and Socket.IO for real-time communication between clients and the server.

## Features

- Real-time multiplayer gameplay
- Simple and intuitive user interface
- Responsive design for both desktop and mobile devices
- Notifications for game events

## Installation

To run this project locally, follow these steps:

1. Clone the repository:
   ```sh
   git clone https://github.com/liwa-dev/RealTime-TicTacToe.git
   cd RealTime-TicTacToe
   ```

2. Install the dependencies:
   ```sh
   npm install
   ```

3. Start the server:
   ```sh
   npm start
   ```

## Usage

Once the server is running, open your browser and navigate to `http://localhost:3000` to start playing the game. You can also access the live version of the game at [https://realtime-tictactoe.onrender.com](https://realtime-tictactoe.onrender.com).

## Project Structure

- **client**: Contains the client-side code (HTML, CSS, JavaScript).
- **public**: Contains static files served by the server (images, stylesheets, etc.).
- **server**: Contains the server-side code (Node.js, Socket.IO).

## Server-Client Communication

The server and client communicate in real-time using Socket.IO. Below is an overview of the key events and messages exchanged between the server and clients.

### Server-Side (Node.js with Socket.IO)

The server listens for various events from the clients and responds accordingly. Here are some key events:

- **connection**: When a new client connects to the server.
- **disconnect**: When a client disconnects from the server.
- **move**: When a client makes a move in the game.
- **notification**: When the server sends a notification to the clients.

### Client-Side (JavaScript with Socket.IO)

The client connects to the server and listens for events. Here are some key events:

- **connect**: When the client successfully connects to the server.
- **move**: When the client receives a move from the server.
- **notification**: When the client receives a notification from the server.

## Contributing

Contributions are welcome! Please fork the repository and submit a pull request for any improvements or bug fixes.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Author

- **liwahadri**
