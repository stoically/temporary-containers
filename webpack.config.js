const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  entry: './src/background.js',
  output: {
    path: path.resolve(__dirname, './dist'),
    filename: 'background.js'
  },
  plugins: [
    new CopyWebpackPlugin(['src/tmpcontainer.js'])
  ]
};
