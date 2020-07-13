var path = require('path');

module.exports = {
  mode: "development",
  entry: path.resolve(__dirname, 'app.js'),
  output: {
    path: path.resolve(__dirname),
    filename: "bundle.js"
  },
  devServer: {
      port:44302,
  }
};
