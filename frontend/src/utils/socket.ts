import { io, Socket } from "socket.io-client";

const token = localStorage.getItem("token");

// ✅ FIX: Thay localhost:3000 → localhost:3004
export const socket = io('http://localhost:3000', {
  transports: ["websocket", "polling"], // ✅ ADD: fallback to polling
  auth: { token },
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: 5,
});

socket.on("connect", () => {
  console.log("✅ Connected:", socket.id);
});

socket.on("connect_error", (err) => {
  console.error("❌ Socket connect error:", err.message);
});

socket.on("disconnect", (reason) => {
  console.log("❌ Disconnected:", reason);
});

socket.on("reconnect_attempt", () => {
  console.log("🔄 Attempting to reconnect...");
});