import { Server } from 'socket.io';

let io;

export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: [
        'http://localhost:3000',
        'https://flowsight-frontend-969140599829.asia-south1.run.app',
        /\.web\.app$/,
        /\.firebaseapp\.com$/
      ],
      methods: ['GET', 'POST']
    }
  });
  return io;
};

export const getIO = () => {
  if (!io) throw new Error('Socket.io not initialized yet');
  return io;
};