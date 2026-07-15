import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';

import User from '../models/User.js';

let io;

export const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL,
      credentials: true,
    },
  });

  io.use(async (socket, next) => {
    try {
      // The client sends the token in the handshake auth object.
      const token = socket.handshake.auth?.token;

      if (!token) {
        return next(new Error('No token provided'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      const user = await User.findById(decoded.id);

      if (!user) {
        return next(new Error('User no longer exists'));
      }

      socket.userId = user._id.toString();

      next();
    } catch (error) {
      next(new Error('Not authorized'));
    }
  });

  io.on('connection', (socket) => {
    socket.join(socket.userId);

    console.log(`Socket connected: user ${socket.userId}`);

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: user ${socket.userId}`);
    });
  });

  return io;
};

export const emitToUser = (userId, event, payload, excludeSocketId = null) => {
  if (!io) return;

  if (excludeSocketId) {
    io.to(userId.toString()).except(excludeSocketId).emit(event, payload);
    return;
  }

  io.to(userId.toString()).emit(event, payload);
};