// test-client.js
const { io } = require("socket.io-client");
const readline = require("readline");

// ----- CONFIG -----
const ROOM_ID = "497a2dc7-7d9b-4061-b133-5490fbb9536e";
const SENDER_ID = "69d84151-da42-4e6c-99ea-38d331e60888";
// -------------------

const socket = io("http://localhost:8000", { transports: ["websocket"] });

// Create readline interface for typing messages
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function showPrompt() {
    rl.setPrompt("You: ");
    rl.prompt(true);
}

socket.on("connect", () => {
    console.log("✅ Connected:", socket.id);

    // Join the room
    socket.emit("join_room", { room_id: ROOM_ID });

    console.log(`Joined room: ${ROOM_ID}`);
    showPrompt();

    // Listen for typed messages
    rl.on("line", (line) => {
        const message = line.trim();
        if (message) {
            socket.emit("send_message", {
                room_id: ROOM_ID,
                sender_id: SENDER_ID,
                message: message
            });
        }
        showPrompt();
    });
});

socket.on("new_message", (data) => {
    // If it's your own message, skip reprinting
    if (data.sender_id === SENDER_ID) return;

    console.log(`\n💬 ${data.sender}: ${data.message}`);
    showPrompt();
});

socket.on("error", (err) => {
    console.error("⚠️ Error:", err);
    showPrompt();
});

socket.on("disconnect", () => {
    console.log("❌ Disconnected");
    rl.close();
});

