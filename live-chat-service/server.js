// server.js
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const path = require("path");          
const connectDB = require("./config/db");
const chatRoutes = require("./routes/chatRoutes");

const app = express();
app.use(cors());
app.use(express.json());

// Connect to DB
connectDB();

// REST API routes 
app.use("/api/chat", chatRoutes);

// Serve static customer UI from /public
app.use(express.static(path.join(__dirname, "public")));  

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // Join room
  socket.on("joinRoom", (room) => {
    socket.join(room);
    console.log(`${socket.id} joined ${room}`);
  });

  // Receive and broadcast messages
  socket.on("chatMessage", async ({ room, sender, message }) => {
    const msg = { room, sender, message, timestamp: new Date() };

    // Broadcast to all clients in that room (admin + customer)
    io.to(room).emit("chatMessage", msg);

    // Save to DB
    const Message = require("./models/messageModel");
    await Message.create({ room, sender, message });
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

server.listen(3036, () => console.log("Live chat server running on port 3036"));