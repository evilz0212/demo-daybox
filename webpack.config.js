const webpack = require('webpack');
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const terserPlugin = require("terser-webpack-plugin");
const optimizeCSSAssetsPlugin = require("optimize-css-assets-webpack-plugin");
const miniCssExtractPlugin = require("mini-css-extract-plugin");
const chokidar = require('chokidar');
const LiveReloadPlugin = require('webpack-livereload-plugin');
const {
    CleanWebpackPlugin
} = require('clean-webpack-plugin');
const PurifyCSSPlugin = require('purifycss-webpack');
const glob = require('glob');

const devMode = process.env.NODE_ENV !== 'production';

module.exports = ({
    name = 'app',
    context = './src',
    output = './dist',
    publicPath = '',
    entry = './main.js',
    template = './index.pug',
} = {}) => {
    const getFilename = (pathString) => path.parse(pathString).name;

    const projectPath = path.resolve(__dirname, name, context);
    const outputPath = path.resolve(__dirname, name, output);

    return {
        context: projectPath,
        entry: {
            [getFilename(entry)]: entry
        },
        output: {
            path: outputPath,
            filename: devMode ? '[name].js' : '[name].build.[contenthash:8].js',
            publicPath: devMode ? '' : publicPath,
        },
        module: {
            rules: [
                {
                    test: /\.(js)$/,
                    exclude: /node_modules/,
                    use: {
                        loader: 'babel-loader',
                        options: {
                            presets: ['@babel/preset-env']
                        }
                    }
                },
                {
                    test: /\.(sa|sc|c)ss$/,
                    use: [
                        devMode ? {
                            loader: 'style-loader'
                        } : miniCssExtractPlugin.loader,
                        {
                            loader: 'css-loader'
                        },
                        {
                            loader: 'postcss-loader',
                            options: {
                                plugins: () => [require('autoprefixer')]
                            }
                        },
                        {
                            loader: 'sass-loader'
                        }
                    ]
                },
                {
                    test: /\.(html)$/,
                    use: [{
                        loader: 'html-loader'
                    }]
                },
                {
                    test: /\.(pug)$/,
                    use: ['raw-loader', 'pug-html-loader']
                },
                {
                    test: /\.(jpe?g|png|gif|svg)$/,
                    use: [
                        {
                            loader: 'file-loader',
                            options: {
                                name: '[name].[ext]',
                                outputPath: 'images/'
                            }
                        },
                        {
                            loader: 'image-webpack-loader',
                            options: {
                                bypassOnDebug: true,
                            }
                        }
                    ]
                },
                {
                    test: /\.(woff|woff2|eot|ttf|otf)$/,
                    use: [
                        {
                            loader: "file-loader",
                            options: {
                                name: "fonts/[name].[ext]"
                            }
                        }
                    ]
                }
            ]
        },
        optimization: {
            minimize: true,
            minimizer: [
                new terserPlugin({
                    sourceMap: true,
                    terserOptions: {
                        output: {
                            comments: false,
                        },
                    },
                }),
                new optimizeCSSAssetsPlugin()
            ],
            splitChunks: {
                chunks: 'all',
                cacheGroups: {
                    vendors: {
                        name: "vendors",
                        test: /[\\/]node_modules[\\/]/,
                        priority: -10
                    },
                    default: {
                        minChunks: 2,
                        priority: -20,
                        reuseExistingChunk: true
                    }
                }
            }

        },
        devServer: {
            before(app, server) {
                // hot reload for html
                chokidar.watch(path.resolve(projectPath, template)).on('all', function () {
                    server.sockWrite(server.sockets, 'content-changed');
                })
            },
            stats: "errors-only",
            host: process.env.HOST,
            port: process.env.PORT,
            hot: true,
            open: true,
        },
        plugins: [
            devMode ? new LiveReloadPlugin({
                appendScriptTag: true
            }) : new webpack.HashedModuleIdsPlugin(),
            new CleanWebpackPlugin(),
            new HtmlWebpackPlugin({
                filename: getFilename(template) + '.html',
                template: template,
                inject: true,
                minify: {
                    removeComments: true,
                    collapseWhitespace: true
                }
            }),
            new miniCssExtractPlugin({
                filename: devMode ? '[name].css' : '[name].[contenthash:8].min.css',
            }),
            new PurifyCSSPlugin({
                paths: glob.sync(path.join(__dirname, 'app/**/*.html')),
            }),
            new webpack.ProvidePlugin({
                $: "jquery",
                jQuery: "jquery"
            })
        ],
        performance: {
            maxEntrypointSize: 5120000,
            maxAssetSize: 5120000
        }
    }
}
