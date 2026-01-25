const io = require("socket.io-client");
const readline = require("readline");

// Connect to backend server
const socket = io("http://localhost:3036");

const room = "room1";
const username = process.argv[2] || "User";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

socket.on("connect", () => {
  console.log(`${username} connected with id: ${socket.id}`);

  // Join the room
  socket.emit("joinRoom", room);

  // Ask for input continuously
  rl.setPrompt(`${username}: `);
  rl.prompt();

  rl.on("line", (line) => {
    if (line.trim() === "") return;
    // Send message to server
    socket.emit("chatMessage", { room, sender: username, message: line.trim() });
    rl.prompt();
  });
});

// Listen for incoming messages
socket.on("chatMessage", (msg) => {
  console.log(`[${msg.room}] ${msg.sender}: ${msg.message}`);
});
