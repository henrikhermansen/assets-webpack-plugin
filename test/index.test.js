/* eslint-env mocha */

const path = require('path')
const rmRf = require('rimraf')
const Plugin = require('../index.js')

const OUTPUT_DIR = path.join(__dirname, '../tmp')
const expectOutput = require('./utils/expectOutput')(OUTPUT_DIR)
const MiniCssExtractPlugin = require('mini-css-extract-plugin')

describe('Plugin', function () {
  beforeEach(function (done) {
    rmRf(OUTPUT_DIR, done)
  })

  it('generates a default file for a single entry point', function (done) {
    const webpackConfig = {
      entry: path.join(__dirname, 'fixtures/one.js'),
      output: {
        path: OUTPUT_DIR,
        filename: 'index-bundle.js'
      },
      plugins: [new Plugin({
        path: 'tmp'
      })]
    }

    let expected = {
      main: {
        js: 'index-bundle.js'
      }
    }
    expected = JSON.stringify(expected)

    const args = {
      config: webpackConfig,
      expected: expected
    }

    expectOutput(args, done)
  })

  it('generates a default file with multiple entry points', function (done) {
    const webpackConfig = {
      entry: {
        one: path.join(__dirname, 'fixtures/one.js'),
        two: path.join(__dirname, 'fixtures/two.js')
      },
      output: {
        path: OUTPUT_DIR,
        filename: '[name]-bundle.js'
      },
      plugins: [new Plugin({ path: 'tmp' })]
    }

    const expected = {
      one: {
        js: 'one-bundle.js'
      },
      two: {
        js: 'two-bundle.js'
      }
    }

    const args = {
      config: webpackConfig,
      expected: expected
    }

    expectOutput(args, done)
  })

  it('allows you to specify your own filename', function (done) {
    const webpackConfig = {
      entry: path.join(__dirname, 'fixtures/one.js'),
      output: {
        path: OUTPUT_DIR,
        filename: 'index-bundle.js'
      },
      plugins: [new Plugin({
        filename: 'foo.json',
        path: 'tmp'
      })]
    }

    const expected = {
      main: {
        js: 'index-bundle.js'
      }
    }

    const args = {
      config: webpackConfig,
      expected: expected,
      outputFile: 'foo.json'
    }

    expectOutput(args, done)
  })

  it('skips source maps', function (done) {
    const webpackConfig = {
      devtool: 'sourcemap',
      entry: path.join(__dirname, 'fixtures/one.js'),
      output: {
        path: OUTPUT_DIR,
        filename: 'index-bundle.js'
      },
      plugins: [new Plugin({ path: 'tmp' })]
    }

    const expected = {
      main: {
        js: 'index-bundle.js'
      }
    }

    const args = {
      config: webpackConfig,
      expected: expected
    }

    expectOutput(args, done)
  })

  it('handles hashes in bundle filenames', function (done) {
    const webpackConfig = {
      entry: path.join(__dirname, 'fixtures/one.js'),
      output: {
        path: OUTPUT_DIR,
        filename: 'index-bundle-[hash].js'
      },
      plugins: [new Plugin({ path: 'tmp' })]
    }

    const expected = /{"main":{"js":"index-bundle-[0-9a-f]+\.js"}}/

    const args = {
      config: webpackConfig,
      expected: expected
    }

    expectOutput(args, done)
  })

  it('handles hashes in a different position', function (done) {
    const webpackConfig = {
      entry: path.join(__dirname, 'fixtures/one.js'),
      output: {
        path: OUTPUT_DIR,
        filename: '[name].js?[hash]'
      },
      plugins: [new Plugin({ path: 'tmp' })]
    }

    const expected = /{"main":{"js":"main\.js\?[0-9a-f]+"}}/

    const args = {
      config: webpackConfig,
      expected: expected
    }

    expectOutput(args, done)
  })

  it('works with ExtractTextPlugin for multiple stylesheets', function (done) {
    const extractTextPlugin1 = new MiniCssExtractPlugin({ filename: '[name]-bundle1.css', chunkFilename: '[id].css' })
    const extractTextPlugin2 = new MiniCssExtractPlugin({ filename: '[name]-bundle2.css', chunkFilename: '[id].css' })
    const webpackConfig = {
      entry: {
        one: path.join(__dirname, 'fixtures/one.js'),
        two: path.join(__dirname, 'fixtures/two.js'),
        styles: path.join(__dirname, 'fixtures/styles.js')
      },
      output: {
        path: OUTPUT_DIR,
        filename: '[name]-bundle.js'
      },
      module: {
        rules: [
          {
            test: /1\.css$/,
            use: [
              MiniCssExtractPlugin.loader,
              'css-loader'
            ]
          },
          {
            test: /2\.css$/,
            use: [
              MiniCssExtractPlugin.loader,
              'css-loader'
            ]
          }
        ]
      },
      plugins: [
        extractTextPlugin1,
        extractTextPlugin2,
        new Plugin({
          path: 'tmp'
        })
      ]
    }

    const expected = {
      one: {
        js: 'one-bundle.js'
      },
      two: {
        js: 'two-bundle.js'
      },
      styles: {
        js: 'styles-bundle.js',
        css: ['styles-bundle1.css', 'styles-bundle2.css']
      }
    }

    const args = {
      config: webpackConfig,
      expected: expected
    }

    expectOutput(args, done)
  })

  it('includes full publicPath', function (done) {
    const webpackConfig = {
      entry: path.join(__dirname, 'fixtures/one.js'),
      output: {
        path: OUTPUT_DIR,
        publicPath: '/public/path/[hash]/',
        filename: 'index-bundle.js'
      },
      plugins: [new Plugin({ path: 'tmp' })]
    }

    const expected = new RegExp('/public/path/[0-9a-f]+/index-bundle.js', 'i')

    const args = {
      config: webpackConfig,
      expected: expected
    }

    expectOutput(args, done)
  })

  it('doesn\'t include full publicPath', function (done) {
    const webpackConfig = {
      entry: path.join(__dirname, 'fixtures/one.js'),
      output: {
        path: OUTPUT_DIR,
        publicPath: '/public/path/[hash]/',
        filename: 'index-bundle.js'
      },
      plugins: [new Plugin({
        path: 'tmp/nested',
        fullPath: false
      })]
    }

    let expected = {
      main: {
        js: 'index-bundle.js'
      }
    }

    expected = JSON.stringify(expected)

    const args = {
      config: webpackConfig,
      expected: expected
    }

    expectOutput(args, done)
  })

  it('allows injection of metadata', function (done) {
    const webpackConfig = {
      entry: path.join(__dirname, 'fixtures/one.js'),
      output: {
        path: OUTPUT_DIR,
        filename: 'index-bundle.js'
      },
      plugins: [new Plugin({
        path: 'tmp',
        metadata: {
          foo: 'bar',
          baz: 'buz'
        }
      })]
    }

    let expected = {
      main: {
        js: 'index-bundle.js'
      },
      metadata: {
        foo: 'bar',
        baz: 'buz'
      }
    }
    expected = JSON.stringify(expected)

    const args = {
      config: webpackConfig,
      expected: expected
    }

    expectOutput(args, done)
  })
})
