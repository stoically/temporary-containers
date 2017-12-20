const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  entry: './src/background.js',
  output: {
    path: path.resolve(__dirname, './tmpcontainer'),
    filename: 'background.js'
  },
  plugins: [
    new CopyWebpackPlugin(['src/userscript.js'])
  ],
  node: {
    process: false
  }
};
