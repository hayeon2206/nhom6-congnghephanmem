import { io } from 'socket.io-client';
import { baseURL } from './axiosClient';
import { useAuthStore } from '../store/authStore';

let socket = null;

/** FR-SIM-02: Socket.IO client — joins the tenant room on the server via the access token. */
export function getSocket() {
  const token = useAuthStore.getState().accessToken;
  if (!token) return null;

  if (!socket) {
    socket = io(baseURL, { auth: { token }, transports: ['websocket'] });
  } else if (socket.auth?.token !== token) {
    socket.auth = { token };
    socket.disconnect().connect();
  }

  return socket;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}
