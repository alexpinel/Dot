const path = require('path');

module.exports = {
  mode: 'production',
  target: 'electron-main',
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'main.bundle.js'
  },
  module: {
    rules: [
      {
        test: /\.m?js$/,
        exclude: /(node_modules|bower_components)/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env'],
            plugins: ['@babel/plugin-syntax-dynamic-import']
          }
        }
      }
    ]
  },
  resolve: {
    extensions: ['.js', '.mjs']
  },
  externals: [
    'electron',
    /^node:/
  ]
};