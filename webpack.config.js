const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  entry: './src/background.js',
  output: {
    path: path.resolve(__dirname, './tmpcontainer'),
    filename: 'background.js'
  },
  plugins: [
    new CopyWebpackPlugin(['src/contentscript.js'])
  ],
  node: {
    process: false
  },
  module: {
    loaders: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'babel-loader',
        query: {
          plugins:[ 'transform-object-rest-spread' ]
        }
      }
    ]
  }
};
