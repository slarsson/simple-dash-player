'use strict';

var gulp = require('gulp');
var uglify = require('gulp-uglify-es').default;
var pump = require('pump');
var concat = require('gulp-concat');
var htmlmin = require('gulp-html-minifier');
var rename = require('gulp-rename');
var sass = require('gulp-sass');

gulp.task('html', (cb) => {
    pump([
        gulp.src('site.html'),
        htmlmin({collapseWhitespace: true}),
        rename('index.html'),
        gulp.dest('.')
    ], cb);
});

gulp.task('js', (cb) => {
    pump([
        gulp.src('script/*.js'),
        uglify(),
        concat('site.js'),
        gulp.dest('.')
    ], cb);
});

gulp.task('css', (cb) => {
    pump([
        gulp.src('css/site.scss'),
        sass({outputStyle: 'compressed'}).on('error', sass.logError),
        rename('main.css'),
        gulp.dest('.')
    ], cb);
});

gulp.task('default', ['html', 'js', 'css']);