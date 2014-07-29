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

var modules = ['animation', 'easing', 'finger', 'requestframe', 'events']

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

var version = function(v, method) {
  v = v.split('.').map(function(val) {
    return parseInt(val, 10)
  })
  if ( method == 'patch' )
    v[2]++
  else if ( method == 'minor' ) {
    v[1]++
    v[2] = 0
  } else if ( method == 'major' ) {
    v[1] = v[2] = 0
    v[0]++
  }
  return 'v'+v.join('.')
}

modules.forEach(function(module) {
  ['patch', 'minor', 'major'].forEach(function(method) {
    gulp.task([module,method].join('-'), function() {
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
          var v = version( pakg.version, method )
          /*
          var v = parseInt(pakg.version.toString().replace(/\./g,''), 10) + 1
          v = v.toString().split('')
          v.splice(-1, 0, '.')
          v.splice(-3, 0, '.')
          v = 'v'+v.join('')
          */
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
})