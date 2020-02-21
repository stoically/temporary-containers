/* eslint-disable */
const path = require('path');
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const VueLoaderPlugin = require('vue-loader/lib/plugin');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
  entry: {
    background: './src/background.ts',
    contentscript: './src/contentscript.ts',
    options: './src/ui/options.ts',
    popup: './src/ui/popup.ts',
  },
  devtool: false,
  mode: 'development',
  node: false,
  module: {
    rules: [
      {
        test: /\.ts$/,
        loader: 'ts-loader',
        exclude: /node_modules/,
        options: {
          appendTsSuffixTo: [/\.vue$/],
        },
      },
      {
        test: /\.vue$/,
        loader: 'vue-loader',
      },
      {
        test: /\.css$/,
        use: ['vue-style-loader', 'css-loader'],
      },
    ],
  },
  optimization: {
    minimize: false,
    splitChunks: {
      chunks: chunk => {
        return ['options', 'popup'].includes(chunk.name);
      },
    },
  },
  resolve: {
    extensions: ['.ts', '.js', '.vue'],
    plugins: [new TsconfigPathsPlugin()],
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist'),
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: 'src/ui/options.html',
      filename: 'options.html',
      chunks: ['options'],
    }),
    new HtmlWebpackPlugin({
      template: 'src/ui/popup.html',
      filename: 'popup.html',
      chunks: ['popup'],
    }),
    new VueLoaderPlugin(),
    new CopyPlugin([
      'src/manifest.json',
      { from: 'src/icons', to: 'icons' },
      { from: 'src/_locales', to: '_locales' },
      { from: 'src/ui/vendor', to: 'vendor' },
    ]),
  ],
};
