// src/config.js
const config = {
  // Développement
  development: {
    apiUrl: 'http://localhost:5000',
    socketUrl: 'http://localhost:4600',
    enableSockets: true
  },
  // Production
  production: {
    apiUrl: 'https://csr-serveur-backend.onrender.com',
    socketUrl: 'wss://csr-serveur-backend.onrender.com',
    enableSockets: true
  }
};

const environment = process.env.NODE_ENV || 'development';
const currentConfig = config[environment];

// Log de configuration
console.log(`⚙️ Configuration chargée: ${environment}`, currentConfig);

export default currentConfig;
