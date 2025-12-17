// src/socket-fixed.js
import { io } from 'socket.io-client';

// Forcer le polling pour Render
const SOCKET_URL = process.env.NODE_ENV === 'production' 
  ? 'https://csr-serveur-backend.onrender.com'
  : 'http://localhost:4600';

console.log('📡 Connexion Socket.IO (polling only) à:', SOCKET_URL);

export const socket = io(SOCKET_URL, {
  autoConnect: true,
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 5,
  transports: ['polling'], // Seulement polling
  forceNew: true,
  timeout: 10000
});

socket.on('connect', () => {
  console.log('✅ Connecté au serveur Socket.IO (polling), ID:', socket.id);
});

socket.on('disconnect', (reason) => {
  console.log('❌ Déconnecté. Raison:', reason);
});

socket.on('connect_error', (error) => {
  console.error('❌ Erreur connexion:', error.message);
});
