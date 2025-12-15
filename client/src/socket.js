// client/src/socket.js
import { io } from 'socket.io-client';

// URL dynamique selon l'environnement
let SOCKET_URL;

if (process.env.NODE_ENV === 'development') {
  // En développement : votre serveur local
  SOCKET_URL = 'http://localhost:4600';
} else {
  // En production : URL de votre serveur Render
  // ⚠️ REMPLACEZ par votre URL Render future
  SOCKET_URL = 'https://votre-app-backend.onrender.com';
}

console.log('📡 Connexion Socket.IO à:', SOCKET_URL);

// Créer et exporter l'instance socket
export const socket = io(SOCKET_URL, {
  autoConnect: true,
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 10,
  transports: ['websocket', 'polling']
});

// Écouteurs d'événements de débogage
socket.on('connect', () => {
  console.log('✅ Connecté au serveur Socket.IO, ID:', socket.id);
});

socket.on('disconnect', (reason) => {
  console.log('❌ Déconnecté du serveur. Raison:', reason);
});

socket.on('connect_error', (error) => {
  console.error('❌ Erreur de connexion Socket.IO:', error.message);
});
