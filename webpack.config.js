const os = require('os')
const path = require('path')
const webpack = require('webpack')
const HappyPack = require('happypack')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const ExtractTextPlugin = require('extract-text-webpack-plugin')
const HtmlWebpackExternalsPlugin = require('html-webpack-externals-plugin')
const FriendlyErrorsWebpackPlugin = require('friendly-errors-webpack-plugin')

const pkg = require('./package.json')

const PORT = 3000
const ENV = {
  DEVELOPMENT: 'development',
  PRODUCTION: 'production',
}
const { NODE_ENV = ENV.DEVELOPMENT } = process.env
const happyThreadPool = HappyPack.ThreadPool({ size: os.cpus().length })
const minify =
  NODE_ENV === ENV.PRODUCTION
    ? {
        removeComments: true,
        collapseWhitespace: true,
        removeEmptyAttributes: true,
        removeAttributeQuotes: true,
        removeRedundantAttributes: true,
        removeScriptTypeAttributes: true,
        removeStyleLinkTypeAttributes: true,
        useShortDoctype: true,
        minifyCSS: true,
        minifyURLs: true,
      }
    : {}

const externalsArr = [
  {
    module: 'react',
    entry: '//cdn.bootcss.com/react/16.10.2/umd/react.production.min.js',
    global: 'React',
  },
  {
    module: 'react-dom',
    entry: '//cdn.bootcss.com/react-dom/16.10.2/umd/react-dom.production.min.js',
    global: 'ReactDOM',
  },
  {
    module: 'react-router-dom',
    entry: '//cdn.bootcdn.net/ajax/libs/react-router-dom/5.1.2/react-router-dom.min.js',
    global: 'ReactRouterDOM',
  },
  {
    module: 'babel-standalone',
    entry: '//cdn.bootcdn.net/ajax/libs/babel-standalone/6.26.0/babel.min.js',
    global: 'Babel',
  },
]

const getExternals = () => {
  let externals = {}
  externalsArr.forEach(item => {
    externals[item.module] = item.global
  })
  return externals
}

/**
 * webpack externals config
 */
const getPluginExternals = () => {
  return externalsArr
}

/**
 * 获取本地ip地址
 * @return {string[]} [ 'localhost', '192.168.199.103' ]
 */
const getIPv4AddressList = () => {
  const networkInterfaces = os.networkInterfaces()
  let result = []

  Object.keys(networkInterfaces).forEach(key => {
    const ips = (networkInterfaces[key] || [])
      .filter(details => details.family === 'IPv4')
      .map(detail => detail.address.replace('127.0.0.1', 'localhost'))

    result = result.concat(ips)
  })

  return result
}

module.exports = {
  mode: NODE_ENV,
  entry: './src/index',
  output: {
    path: path.resolve(__dirname, './dist'),
    chunkFilename: `js/[name].[hash:5].${pkg.version}.js`,
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.jsx', '.js'],
  },
  externals: getExternals(),
  module: {
    rules: [
      {
        test: /\.(jsx?|tsx?)$/,
        include: [path.resolve(__dirname, './src')],
        exclude: /node_modules/,
        use: ['happypack/loader?id=babel'],
      },
      {
        test: /\.s[ac]ss$/i,
        use: ExtractTextPlugin.extract({
          fallback: 'style-loader',
          //如果需要，可以在 sass-loader 之前将 resolve-url-loader 链接进来
          use: ['css-loader', 'sass-loader'],
        }),
      },
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.svg$/,
        use: [
          'raw-loader',
          {
            loader: 'svgo-loader',
            options: {
              plugins: [{ removeViewBox: false }],
            },
          },
        ],
      },
      {
        test: /\.(jpe?g|png|gif)$/i,
        loader: 'file-loader',
      },
      {
        test: /\.md$/,
        loader: 'raw-loader',
      },
    ],
  },
  devServer: {
    quiet: true,
    port: PORT,
    compress: true,
    hot: true,
    open: false,
    overlay: true,
    progress: true,
    host: '0.0.0.0',
  },
  devtool: 'cheap-module-eval-source-map',
  plugins: [
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, './public/index.html'),
      favicon: path.resolve(__dirname, './public/favicon.ico'),
      NODE_ENV,
      minify,
    }),
    NODE_ENV === ENV.PRODUCTION
      ? new HtmlWebpackExternalsPlugin({
          externals: getPluginExternals(),
        })
      : () => {},
    new FriendlyErrorsWebpackPlugin({
      compilationSuccessInfo: {
        messages: getIPv4AddressList().map(d => `> http://${d}:${PORT}`),
        notes: ['Some additional notes to be displayed upon successful compilation'],
      },
    }),
    new webpack.NamedModulesPlugin(),
    new ExtractTextPlugin({
      filename: `css/[name].[hash:5].${pkg.version}.css`,
      allChunks: true,
    }),
    new HappyPack({
      id: 'babel',
      loaders: [
        {
          loader: 'babel-loader',
          options: {
            cacheDirectory: true,
          },
        },
      ],
      threadPool: happyThreadPool,
    }),
  ],
}
