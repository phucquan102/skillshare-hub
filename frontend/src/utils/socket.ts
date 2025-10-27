import { io, Socket } from "socket.io-client";

const token = localStorage.getItem("token");

export const socket: Socket = io("http://localhost:3000", {
  transports: ["websocket"],
  auth: { token },
});

socket.on("connect", () => {
  console.log("✅ Connected:", socket.id);
});

socket.on("connect_error", (err) => {
  console.error("❌ Socket connect error:", err.message);
});
