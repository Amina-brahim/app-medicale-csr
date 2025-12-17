// client/src/socket.js
import { io } from 'socket.io-client';
import config from './config';

console.log('📡 Connexion Socket.IO à:', config.socketUrl);

// Créer et exporter l'instance socket SEULEMENT si activé
export const socket = config.enableSockets ? io(config.socketUrl, {
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
  console.log('ℹ️ Socket.IO désactivé');
}
