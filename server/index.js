const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';
const io = new Server(server, {
  cors: {
    origin: CLIENT_URL, // Utilisation de l'URL du client pour CORS
    methods: ['GET', 'POST']
  },
  path: '/api/socket.io' // Ajout du chemin pour Socket.IO
});

// Préfixer les routes API
app.use('/api', (req, res) => {
  res.send('API is running');
});

const rooms = {};

io.on('connection', (socket) => {
  console.log('a user connected');

  socket.on('join-room', (roomId) => {
    socket.join(roomId);
    if (!rooms[roomId]) {
      rooms[roomId] = [];
    }
    rooms[roomId].push(socket.id);

    const otherUsers = rooms[roomId].filter(id => id !== socket.id);

    // Notifier les autres utilisateurs
    otherUsers.forEach(otherId => {
      io.to(otherId).emit('user-connected', socket.id);
    });

    console.log(`User ${socket.id} joined room ${roomId}`);
  });

  socket.on('offer', ({ offer, roomId }) => {
    socket.to(roomId).emit('offer', { offer });
  });

  socket.on('answer', ({ answer, roomId }) => {
    socket.to(roomId).emit('answer', { answer });
  });

  socket.on('ice-candidate', ({ candidate, roomId }) => {
    socket.to(roomId).emit('ice-candidate', { candidate });
  });

  socket.on('disconnect', () => {
    console.log('a user disconnected');
    for (const roomId in rooms) {
      rooms[roomId] = rooms[roomId].filter(id => id !== socket.id);
      if (rooms[roomId].length === 0) {
        delete rooms[roomId];
      }
    }
  });
});

server.listen(8000, () => {
  console.log('Server listening on port 8000');
});
