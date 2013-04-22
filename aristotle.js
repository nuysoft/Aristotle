/*
    Aristotle
    I love my teacher Plato greatly, but I love truth more.
    
*/
var spawn = require('child_process').spawn,
    $ = require('jquery'),
    shas;
require('colors')

exports.rm = function rm(src, next) {
    var cmd = spawn('rm', ['-fr', src])
    cmd.stdout.on('data', function(data) {
        console.log('[rm] '.green + data)
    })
    cmd.stderr.on('data', function(data) {
        console.log('[rm] '.red + data)
    })
    cmd.on('exit', function() { // code, signal
        next();
    })
}

exports.clone = function clone(repo, src, next) {
    var cmd = spawn('git', ['clone', repo, src])
    cmd.stdout.on('data', function(data) {
        console.log('[git clone]\n'.green + data)
    })
    cmd.stderr.on('data', function(data) {
        console.log('[git clone]\n'.red + data)
    })
    cmd.on('exit', function() { // code, signal
        next();
    })
}

exports.log = function log(report, src, next) {
    process.chdir(src);
    console.log('[git log]'.green);
    var out = '';
    var cmd = spawn('git', ['log', '--pretty=format:%h, %cd, %s'])
    cmd.stdout.on('data', function(data) {
        data = (data + '').trim().replace(/^\n|\n$/g, '').trim()
        out += data;

        data = data.split('\n').join('\n    ');
        console.log('    ' + data)
    });
    cmd.stdout.on('end', function() {
        shas = out.split('\n')
        next()
    });
    cmd.stderr.on('data', function(data) {
        data = (data + '').trim().replace(/^\n|\n$/g, '').trim()
        console.log('    ' + data.red);
    });
    cmd.on('exit', function() { // code, signal
        process.chdir(exports.cwd);
    });
}

// git checkout a730256
exports.checkout = function checkout(src, sha, next) {
    process.chdir(src);
    console.log('[git checkout]'.green);
    var cmd = spawn('git', ['checkout', sha.split(', ')[0]]),
        out = [],
        err = [];
    cmd.stdout.on('data', function(data) {
        data = (data + '').trim().replace(/^\n|\n$/g, '').trim()
        console.log('    ' + data);
    })
    cmd.stdout.on('end', function() {})
    cmd.stderr.on('data', function(data) {
        data = (data + '').trim().replace(/^\n|\n$/g, '').trim()
        console.log('    ' + data.red);
    })
    cmd.on('exit', function() { // code, signal
        process.chdir(exports.cwd);
        next()
    })
}

// plato -r -D 1366616188980 -d pure-pagination.git-report pure-pagination.git

/*
Usage : plato [options] file1.js file2.js ... fileN.js

-h, --help
  Display this help text.
-q, --quiet
  Reduce output to errors only
-v, --version
  Print the version.
-x, --exclude : String
  File exclusion regex
-d, --dir : String *required*
  The output directory
-r, --recurse
  Recursively search directories
-l, --jshint : String
  Specify a jshintrc file for JSHint linting
-t, --title : String
  Title of the report
-D, --date : String
  Time to use as the report date (seconds, > 9999999999 assumed to be ms)

clear; plato -r -D 1366616188 -d pure-pagination.git-report pure-pagination.git
clear; plato -D 1366616188 -t pure-pagination.git -r -d pure-pagination.git-report pure-pagination.git
node plato.js https://github.com/nuysoft/pure-pagination.git
node plato.js pure-pagination-report pure-pagination    
*/

exports.plato = function plato(src, sha, report, next) {
    console.log('[plato]'.green + '\n    ' + sha);
    var D = new Date(sha.split(', ')[1]);
    var cmd = spawn('plato', ['-D ' + D.getTime() / 1000, '-t ' + src, '-r', '-d', report, src])
    cmd.stdout.on('data', function(data) {
        data = (data + '').trim().replace(/^\n|\n$/g, '').trim()
        console.log('    ' + data);
    })
    cmd.stdout.on('end', function() {})
    cmd.stderr.on('data', function(data) {
        console.log('    ' + data.red);
    })
    cmd.on('exit', function() { // code, signal
        next()
    })
}

exports.doit = function doit(report, src, next) {
    var channel = $({});
    shas.reverse().forEach(function(sha, index) {
        if (!index) return;
        channel.queue('doit', function(next) {
            exports.checkout(src, sha, next)
        }).queue('doit', function(next) {
            exports.plato(src, sha, report, next)
        })
    })
    channel.queue('doit', next).dequeue('doit')
}

exports.aristotle = function() {
    exports.cwd = process.cwd();

    var len = process.argv.length;
    var report = process.argv[len - 2],
        src = process.argv[len - 1];

    if (len < 4 || !src || !report) {
        console.log('node plato.js report src')
        return
    }

    $({}).queue(function(next) {
        exports.log(report, src, next)
    }).queue(function(next) {
        exports.doit(report, src, next)
    })
}

exports.aristotle()