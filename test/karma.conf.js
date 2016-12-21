// Karma configuration
// Generated on Sun Dec 04 2016 09:30:02 GMT-0500 (EST)

module.exports = function(config) {
  config.set({

    basePath: '',

    frameworks: ['jasmine'],

    files: [
      '../node_modules/vue/dist/vue.js',
      '../dist/js/selectiv.min.js',
      '*_spec.js',
    ],

    exclude: [],

    reporters: ['progress'],

    port: 9876,

    colors: true,

    logLevel: config.LOG_INFO,

    autoWatch: true,

    browsers: ['PhantomJS'],

    singleRun: false,

    concurrency: Infinity
  })
}
