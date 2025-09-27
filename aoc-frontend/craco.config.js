const path = require('path');

module.exports = {
  webpack: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  devServer: {
    // Configure dev server to use correct WebSocket URL
    client: {
      webSocketURL: 'auto://0.0.0.0:0/ws',
    },
    // Ensure dev server listens on all interfaces
    host: '0.0.0.0',
    port: 3000,
    // Disable host checking for development
    allowedHosts: 'all',
  },
};
