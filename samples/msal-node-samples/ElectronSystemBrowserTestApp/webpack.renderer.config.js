const rules = require('./webpack.rules');
const plugins = require('./webpack.plugins');

rules.push({
    test: /\.(scss)$/,
    use: [
        { loader: "style-loader" },
        { loader: "css-loader" },
        { loader: "sass-loader" },
        {
            loader: "postcss-loader",
            options: {
                postcssOptions: {
                    plugins: function () {
                        return [require("autoprefixer")];
                    },
                },
            },
        },
    ],
});

module.exports = {
  module: {
    rules,
  },
  plugins: plugins,
  resolve: {
    extensions: ['.js', '.ts', '.jsx', '.tsx', '.css'],
  },
};