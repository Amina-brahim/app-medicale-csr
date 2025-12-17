// src/config.js
const config = {
  // Développement
  development: {
    apiUrl: 'http://localhost:5000',
    socketUrl: 'http://localhost:5000',
  },
  // Production
  production: {
    apiUrl: process.env.REACT_APP_API_URL || 'https://app-medicale-csr..onrender.com',
    socketUrl: process.env.REACT_APP_SOCKET_URL || 'https://app-medicale-csr..onrender.com',
  }
};

export default config[process.env.NODE_ENV || 'development'];
