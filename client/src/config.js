// src/config.js
const config = {
  // Développement
  development: {
    apiUrl: 'http://localhost:4600',
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

console.log(`⚙️ Configuration: ${environment}`, currentConfig);

export default currentConfig;
