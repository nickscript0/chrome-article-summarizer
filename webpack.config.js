const path = require('path');
const WebpackNotifierPlugin = require('webpack-notifier');

module.exports = {
    entry: {
        main: './src/main.ts',
        display: './src/display.ts',
        background: './src/background.ts',
        summarize_worker: './src/summarize-worker.ts',
        popup: './src/popup.ts'
    },
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: '[name].bundle.js',
        publicPath: '/dist/'
    },
    plugins: [
        new WebpackNotifierPlugin({ excludeWarnings: true, alwaysNotify: true, timeout: 1 })
    ],
    resolve: {
        // Add `.ts` and `.tsx` as a resolvable extension.
        extensions: ['.webpack.js', '.web.js', '.ts', '.tsx', '.js']
    },
    module: {
        rules: [
            // all files with a `.ts` or `.tsx` extension will be handled by `ts-loader`
            { test: /\.tsx?$/, loader: 'ts-loader' }
        ]
    },
    mode: 'development',
    devtool: 'source-map'
}