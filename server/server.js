const express = require('express');
const cors = require('cors');
const http = require('http');

const app = express();
const server = http.createServer(app);

// CORS pour accepter votre frontend
app.use(cors({
  origin: ['http://localhost:3000', 'https://app-medicale-*.vercel.app'],
  credentials: true
}));

app.use(express.json());

// ROUTE RACINE - OBLIGATOIRE
app.get('/', (req, res) => {
  res.json({
    message: 'CSR Medical Backend Server',
    status: 'running',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// ROUTE HEALTH - OBLIGATOIRE
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    status: 'OK',
    service: 'CSR Medical Backend',
    uptime: process.uptime(),
    port: process.env.PORT || 5000,
    timestamp: new Date().toISOString()
  });
});

// Route de test simple
app.get('/api/test', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Backend test successful',
    data: { test: 'ok' }
  });
});

// Route pour vérifier que l'API répond
app.get('/api/ping', (req, res) => {
  res.json({ pong: Date.now() });
});

// Port pour Render - IMPORTANT: utiliser process.env.PORT
const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`==========================================`);
  console.log(`✅ SERVEUR BACKEND DÉMARRÉ`);
  console.log(`📍 Port: ${PORT}`);
  console.log(`🌐 URL Render: https://csr-serveur-backend.onrender.com`);
  console.log(`🏥 Health: https://csr-serveur-backend.onrender.com/api/health`);
  console.log(`==========================================`);
});
