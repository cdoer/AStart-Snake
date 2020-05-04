const path = require('path');
var webpack = require('webpack');
var HtmlWebpackPlugin = require('html-webpack-plugin'); //打包html的插件
var Version = new Date().getTime();
var buildPath = path.resolve(__dirname, '../dist');

module.exports = {
    watch: true,
    entry: {
        app:'./src/index.js',
    },
    output: {
        filename: '[name].bundle'+Version+'.js',
        path: path.resolve(__dirname, buildPath),
    },
    module: {
        rules: [    // 其中包含各种loader的使用规则
            {
                test: /\.css$/,  // 正则表达式，表示打包.css后缀的文件
                use: ['style-loader','css-loader','postcss-loader']   // 针对css文件使用的loader，注意有先后顺序，数组项越靠后越先执行
            },
            {
                test: /\.js$/,
                use: [
                    {
                        loader: 'babel-loader',
                        options: {
                            cacheDirectory: true,
                            presets: ['babel-preset-env'],
                        },
                    },
                ],
            },
            {   // 图片打包
                test: /\.(png|jpg|gif|svg)$/,
                loader: 'url-loader',
                options: {
                    name: './images/[name].[ext]',
                    limit: 8192
                }
            }
        ]
    },
    devServer: {
        compress: true,
        contentBase: path.resolve(__dirname, '..', 'dist'),
        clientLogLevel: 'none',
        quiet: false,
        open: true,
        historyApiFallback: {
            disableDotRule: true,
        },
        watchOptions: {
            ignored: /node_modules/,
        }
    },
    plugins: [
        new HtmlWebpackPlugin({
            title: 'Snake',
            template: 'src/index.html',
            minify: { // 压缩HTML文件
                removeComments: true, // 移除HTML中的注释
                collapseWhitespace: true, // 删除空白符与换行符
                minifyCSS: true// 压缩内联css
            }
        }),
        new webpack.LoaderOptionsPlugin({
            options: {
                postcss: [     //浏览器自动补全前缀
                    require("autoprefixer")({
                        browsers: ["last 5 versions"]
                    })
                ]
            }
        })
    ]
};
