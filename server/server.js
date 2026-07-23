import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { GameEngine } from './src/gameEngine.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const gameEngine = new GameEngine();

app.get('/', (req, res) => {
  res.send({ status: 'ok', name: 'Buckshot Roulette Multiplayer API' });
});

// Broadcast game state to all players in a room safely
function broadcastRoomState(room) {
  if (!room) return;
  room.players.forEach(p => {
    const state = gameEngine.getSanitizedState(room, p.socketId);
    io.to(p.socketId).emit('game_state_update', state);
  });
}

io.on('connection', (socket) => {
  console.log(`🔌 Player connected: ${socket.id}`);

  // Create room
  socket.on('create_room', ({ nickname }, callback) => {
    const room = gameEngine.createRoom(socket.id, nickname);
    socket.join(room.code);
    console.log(`🏠 Room created: ${room.code} by ${nickname}`);
    if (callback) callback({ code: room.code });
    broadcastRoomState(room);
  });

  // Join room
  socket.on('join_room', ({ code, nickname }, callback) => {
    const result = gameEngine.joinRoom(code, socket.id, nickname);
    if (result.error) {
      if (callback) callback({ error: result.error });
      return;
    }

    const room = result.room;
    socket.join(room.code);
    console.log(`👥 Player ${nickname} joined room ${room.code}`);
    if (callback) callback({ success: true, code: room.code });
    broadcastRoomState(room);
  });

  // Action: Shoot (self or opponent)
  socket.on('shoot', ({ code, target }, callback) => {
    const room = gameEngine.getRoom(code);
    if (!room) return callback && callback({ error: 'Phòng không tồn tại!' });

    const result = gameEngine.handleShoot(room, socket.id, target);
    if (result.error) {
      if (callback) callback({ error: result.error });
      return;
    }

    if (callback) callback(result);
    broadcastRoomState(room);
  });

  // Action: Use Item
  socket.on('use_item', ({ code, itemIndex, extraTarget }, callback) => {
    const room = gameEngine.getRoom(code);
    if (!room) return callback && callback({ error: 'Phòng không tồn tại!' });

    const result = gameEngine.handleUseItem(room, socket.id, itemIndex, extraTarget);
    if (result.error) {
      if (callback) callback({ error: result.error });
      return;
    }

    if (result.privateFeedback) {
      socket.emit('private_hint', { hint: result.privateFeedback });
    }

    if (callback) callback({ success: true });
    broadcastRoomState(room);
  });

  // Action: Restart / Rematch
  socket.on('restart_game', ({ code }) => {
    const room = gameEngine.getRoom(code);
    if (!room) return;
    gameEngine.restartGame(room);
    broadcastRoomState(room);
  });

  // Handle Disconnect
  socket.on('disconnect', () => {
    console.log(`❌ Player disconnected: ${socket.id}`);
    const result = gameEngine.removePlayer(socket.id);
    if (result && result.room) {
      broadcastRoomState(result.room);
    }
  });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`🚀 Buckshot Roulette Server running on http://localhost:${PORT}`);
});
