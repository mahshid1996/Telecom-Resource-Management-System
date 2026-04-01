# 📄 README.md – Live Chat Service

# Live Chat Service

The Live Chat Service provides real-time communication between customers and DRM administrators.

It is implemented as an independent microservice using WebSocket-based communication (Socket.IO) and MongoDB for persistent message storage.

This service demonstrates:

- Real-time bidirectional communication
- Room-based message isolation
- REST + WebSocket hybrid design
- Persistent chat history
- Microservice separation

---

## Architecture Overview

The Live Chat Service follows a layered microservice architecture:

- Express.js → REST API layer
- Socket.IO → Real-time communication layer
- MongoDB → Persistent message storage
- Mongoose → ODM for schema modeling
- Static HTML → Customer-side chat interface

The system supports multiple chat rooms using Socket.IO room isolation.

---

## Features

- Real-time chat using WebSockets
- Persistent chat history
- Room-based messaging
- REST endpoint for retrieving chat history
- Static demo UI
- CLI test client for simulation

---

## Technology Stack

- Node.js
- Express.js
- Socket.IO
- MongoDB
- Mongoose
- CORS

---

## Folder Structure

config/ → Database connection  
models/ → MongoDB message schema  
routes/ → REST API endpoints  
public/ → Static customer chat UI  
server.js → Application entry point  

---

## Running Locally

### 1️⃣ Install dependencies

npm install

### 2️⃣ Start MongoDB

Make sure MongoDB is running locally:

mongodb://localhost:27017/resourceDB

### 3️⃣ Start the server

node server.js

Server will start on:

http://localhost:3036

---

## Accessing the Chat

Customer UI:

http://localhost:3036/customer-chat.html

This page connects automatically via Socket.IO.

---

## REST API

GET /api/chat/:room

Returns all messages sorted by timestamp.

Example:

GET http://localhost:3036/api/chat/room1

---

## Test via CLI

You can simulate chat users using:

node testClient.js Admin  
node testClient.js Customer  

Both will join room1 and exchange messages.

---

## Execution Flow

1. Client connects via WebSocket
2. Client joins a specific room
3. Messages are broadcasted to room members
4. Messages are stored in MongoDB
5. Chat history is retrievable via REST

---

## Future Improvements

- JWT authentication
- Role-based room access
- Typing indicators
- Message delivery acknowledgment
- Scaling with Redis adapter
- Docker containerization

---