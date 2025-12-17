// src/config.js - Socket.IO DÉSACTIVÉ
const config = {
  development: {
    apiUrl: 'http://localhost:4600',
    enableSockets: false
  },
  production: {
    apiUrl: 'https://csr-serveur-backend.onrender.com',
    enableSockets: false
  }
};

const environment = process.env.NODE_ENV || 'development';
const currentConfig = config[environment];

console.log(`⚙️ Configuration: ${environment}`, currentConfig);

export default currentConfig;
