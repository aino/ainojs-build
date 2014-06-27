var gulp = require('gulp')
var gutil = require('gulp-util')
var fs = require('fs')
var es = require('event-stream')
var browserify = require('browserify')
var map = require('vinyl-map')
var source = require('vinyl-source-stream')
var buffer = require('gulp-buffer')
var concat = require('gulp-concat')
var path = require('path')

var modules = ['animate', 'easing', 'finger', 'requestframe']

var gulpBrowserify = function(options, bundleOptions, commands) {
  var b
  options.extensions || (options.extensions = ['.js'])
  bundleOptions || (bundleOptions = {})
  b = browserify(options)

  for ( cmd in commands ) {
    values = commands[cmd]
    if ( typeof values === 'string' ) values = [values]
    values.forEach(function(value) {
      b[cmd](value)
    })
  }
  return b.bundle(bundleOptions)
}

modules.forEach(function(module) {
  gulp.task(module, function() {
    gutil.log('Building '+module)
    var src = path.join('../', 'ainojs-'+module, module+'.js')
    gulpBrowserify({
      entries: src
    },{
      debug: false,
      standalone: module.charAt(0).toUpperCase() + module.substr(1)
    })
    .on('error', function(trace) {
      console.error(trace)
    })
    .pipe(source())
    .pipe(buffer())
    .pipe(concat(module+'.js'))
    .pipe(gulp.dest(path.join('../', 'ainojs-'+module, 'dist')))
  })
})