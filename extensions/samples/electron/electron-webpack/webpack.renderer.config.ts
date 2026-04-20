import type { Configuration } from 'webpack';

import { rules } from './webpack.rules';
import { plugins } from './webpack.plugins';

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

export const rendererConfig: Configuration = {
    module: {
        rules,
    },
    plugins,
    resolve: {
        extensions: [".js", ".ts", ".jsx", ".tsx", ".css"],
    },
    devtool: "inline-source-map",
};



