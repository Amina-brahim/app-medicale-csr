// client/src/socket.js
import { io } from 'socket.io-client';

// URL dynamique selon l'environnement
let SOCKET_URL;

if (process.env.NODE_ENV === 'development') {
  // En développement : votre serveur local
  SOCKET_URL = 'http://localhost:4600';
} else {
  // En production : utilisez la variable d'environnement ou désactivez si pas de backend
  SOCKET_URL = process.env.REACT_APP_SOCKET_URL || null;
}

console.log('📡 Connexion Socket.IO à:', SOCKET_URL);

// Créer et exporter l'instance socket SEULEMENT si une URL est configurée
export const socket = SOCKET_URL ? io(SOCKET_URL, {
  autoConnect: true,
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 10,
  transports: ['websocket', 'polling']
}) : null;

// Écouteurs d'événements de débogage (seulement si socket existe)
if (socket) {
  socket.on('connect', () => {
    console.log('✅ Connecté au serveur Socket.IO, ID:', socket.id);
  });

  socket.on('disconnect', (reason) => {
    console.log('❌ Déconnecté du serveur. Raison:', reason);
  });

  socket.on('connect_error', (error) => {
    console.error('❌ Erreur de connexion Socket.IO:', error.message);
  });
} else {
  console.log('ℹ️ Socket.IO désactivé (aucune URL configurée)');
}
