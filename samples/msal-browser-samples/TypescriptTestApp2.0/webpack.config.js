const path = require('path');

module.exports = {
  entry: './build-babel/index.js',
  resolve: {
    extensions: [ '.js' ],
  },
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
    library: "App"
  },
  devtool: "source-map"
};
