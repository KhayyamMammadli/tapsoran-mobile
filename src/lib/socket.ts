import { io, Socket } from "socket.io-client";
import { API_URL } from "../config";

let socket: Socket | null = null;

export function connectSocket(token: string) {
  socket = io(API_URL, { auth: { token }, transports: ["websocket"] });
  return socket;
}

export function getSocket() {
  return socket;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}
