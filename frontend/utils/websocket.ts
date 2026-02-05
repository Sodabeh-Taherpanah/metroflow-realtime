import { io, Socket } from 'socket.io-client';

const socket: Socket = io('http://localhost:3001', {
  transports: ['websocket'],
  autoConnect: false,
});

export const connectSocket = () => {
  if (!socket.connected) {
    socket.connect();
  }
};

export const disconnectSocket = () => {
  if (socket.connected) {
    socket.disconnect();
  }
};

export default socket;
