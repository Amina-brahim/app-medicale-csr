const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIO = require('socket.io');

const app = express();
const server = http.createServer(app);

// CORS
const corsOptions = {
  origin: ['http://localhost:3000', 'https://*.vercel.app'],
  credentials: true
};
app.use(cors(corsOptions));
app.use(express.json());

// Route santé OBLIGATOIRE
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    service: 'CSR Backend',
    timestamp: new Date().toISOString(),
    port: 5000
  });
});

// Socket.IO
const io = socketIO(server, {
  cors: corsOptions
});

io.on('connection', (socket) => {
  console.log('🔌 Client connecté:', socket.id);
});

// ÉCOUTER SUR 0.0.0.0 (IMPORTANT) et port 5000
const PORT = 5000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Serveur backend démarré sur le port ${PORT}`);
  console.log(`🌐 URL: http://localhost:${PORT}`);
  console.log(`🏥 Health: http://localhost:${PORT}/api/health`);
});

module.exports = server;
