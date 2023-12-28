// webpack.config.js
const path = require('path');

module.exports = {
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'), // Adjust 'src' to your source code directory
    },
  },
};
