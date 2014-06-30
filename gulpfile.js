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
var uglify = require('gulp-uglify')
var moment = require('moment')

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
    var upper = module.charAt(0).toUpperCase() + module.substr(1)
    var src = path.join('../', 'ainojs-'+module, module+'.js')
    gulpBrowserify({
      entries: src
    },{
      debug: false,
      standalone: upper
    }, {
      external: ["react", "jquery", "underscore", "backbone"]
    })
    .on('error', function(trace) {
      console.error(trace)
    })
    .pipe(source())
    .pipe(buffer())
    .pipe(uglify())
    .pipe(map(function(data, file) {
      var script = data.toString()
      var header = ''
      var pakg = fs.readFileSync(path.join('../', 'ainojs-'+module, 'package.json'))
      if ( pakg ) {
        pakg = JSON.parse(pakg.toString())
        var v = parseInt(pakg.version.toString().replace(/\./g,''), 10) + 1
        v = v.toString().split('')
        v.splice(-1, 0, '.')
        v.splice(-3, 0, '.')
        v = 'v'+v.join('')
        var comments = [
          pakg.name + ' ' + v,
          moment().format("MMMM Do YYYY"),
          '(c) Aino',
          'MIT Licensed'
        ]
        header = '/* '+comments.join(' - ') + ' */\n'
      }
      return header+script
    }))
    .pipe(concat(module+'.min.js'))
    .pipe(gulp.dest(path.join('../', 'ainojs-'+module, 'dist')))
  })
})