require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// In-memory storage for guard locations (Replace with Redis for production)
let guardLocations = {};

// When a client connects
io.on("connection", (socket) => {
    console.log(`Client connected: ${socket.id}`);

    // Guard sends live location
    socket.on("guard_location", ({ guardId, latitude, longitude }) => {
        guardLocations[guardId] = { latitude, longitude, timestamp: Date.now() };
        io.emit(`location_update_${guardId}`, guardLocations[guardId]); // Notify officers tracking this guard
    });

    // Officer requests to track a specific guard
    socket.on("track_guard", (guardId) => {
        if (guardLocations[guardId]) {
            socket.emit(`location_update_${guardId}`, guardLocations[guardId]); // Send last known location
        }
    });

    socket.on("disconnect", () => {
        console.log(`Client disconnected: ${socket.id}`);
    });
});

// Health check route
app.get("/", (req, res) => {
    res.send("Guard Tracking WebSocket Server is Running...");
});

// Start the server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
