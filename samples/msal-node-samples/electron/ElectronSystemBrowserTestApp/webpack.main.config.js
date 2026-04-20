module.exports = {
    /**
     * This is the main entry point for your application, it's the first file
     * that runs in the main process.
     */
    entry: "./src/App.ts",
    // Put your normal webpack config below here
    module: {
        rules: require("./webpack.rules"),
    },
    resolve: {
        extensions: [".js", ".ts", ".jsx", ".tsx", ".css", ".json"],
    },
    externals: {
        "node-fetch": "commonjs2 node-fetch",
    },
};


