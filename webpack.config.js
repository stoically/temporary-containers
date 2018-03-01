const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  entry: './src/background.js',
  output: {
    path: path.resolve(__dirname, './build'),
    filename: 'tmpcontainer/background.js'
  },
  mode: 'production',
  plugins: [
    new CopyWebpackPlugin([
      'README.md',
      'LICENSE',
      'src/manifest.json',
      {from: 'icons', to: 'icons'},
      {from: 'src/contentscript.js', to: 'tmpcontainer'},
      {from: 'src/ui', to: 'tmpcontainer/ui'}
    ])
  ],
  optimization: {
    minimize: false
  },
  node: {
    process: false
  }
};
