// src/socket.js - Socket.IO DÉSACTIVÉ
console.log('🚫 Socket.IO désactivé - Mode API REST');

export const socket = null;

// Export pour compatibilité
export const mockSocket = {
  on: () => console.log('⚠️ Socket.IO désactivé'),
  emit: () => console.log('⚠️ Socket.IO désactivé'),
  disconnect: () => {},
  connected: false,
  id: null
};
