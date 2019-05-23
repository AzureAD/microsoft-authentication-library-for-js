var path = require("path");
var webpack = require("webpack");
var UglifyJsPlugin = require('uglifyjs-webpack-plugin');
var package = require('./package');
var ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');

var PATHS = {
  entryPoint: path.resolve(__dirname, 'src/index.ts'),
  bundles: path.resolve(__dirname, 'dist'),
}

module.exports = {
  mode: "production",
  entry: {
    'msal': [PATHS.entryPoint],
    'msal.min': [PATHS.entryPoint]
  },
  output: {
    path: PATHS.bundles,
    filename: '[name].js',
    libraryTarget: 'umd',
    library: 'Msal',
    umdNamedDefine: true
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js']
  },

  devtool: 'inline-source-map',
  plugins: [
      new ForkTsCheckerWebpackPlugin(),
      new webpack.BannerPlugin({
        banner: `/*! ${package.name} v${package.version} ${new Date().toISOString().split('T')[0]} */\n'use strict';`,
        raw: true
      })
  ],
  optimization: {
    minimize: true,
    minimizer: [new UglifyJsPlugin({
      include: /\.min\.js$/
    })]
  },
  module: {
    rules: [{
      test: /\.(ts|tsx|js)?$/,
      use: {
        loader: 'ts-loader',
        options: {
          transpileOnly: true,
        }
      }
    }]
  }
}