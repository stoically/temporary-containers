const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  entry: './src/background.js',
  output: {
    path: path.resolve(__dirname, './tmpcontainer'),
    filename: 'background.js'
  },
  plugins: [
    new CopyWebpackPlugin([
      'src/contentscript.js',
      {from: 'src/ui', to: 'ui'}
    ]),
  ],
  node: {
    process: false
  }
};
