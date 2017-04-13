/* globals require */
"use strict";

//Required
var gulp = require("gulp");
var pump = require("pump");
var autoprefixer = require("gulp-autoprefixer");
var uglify = require("gulp-uglify");
var rename = require("gulp-rename");
var sass = require("gulp-sass");
var sourcemaps = require("gulp-sourcemaps");
var concat = require("gulp-concat");
var stripStyleComments = require("gulp-strip-css-comments");
var stripComments = require("gulp-strip-comments");

var jsFiles = [
	"./bower_components/jquery/dist/jquery.js",
	"./bower_components/tether/dist/js/tether.js",
	"./bower_components/bootstrap/dist/js/bootstrap.js",
	"./js/**/*.js",
	"!./js/dist/*.js"
];

var sassFiles = [
	"./bower_components/tether/src/css/tether.sass",
	"./bower_components/tether/src/css/tether-theme-basic.sass",
	"./bower_components/tether/src/css/tether-theme-arrows.sass",
	"./bower_components/tether/src/css/tether-theme-arrows-dark.sass",
	"./bower_components/bootstrap/scss/bootstrap.scss",
	"./sass/**/*.scss"
];

gulp.task("sass", function (cb) {
	pump([
		gulp.src(sassFiles),
		sourcemaps.init(),
		sass({outputStyle: "compressed"}).on("error", sass.logError),
		autoprefixer(),
		concat("all.css"),
		stripStyleComments({preserve: false}),
		sourcemaps.write("./"),
		gulp.dest("./css/dist")
	], cb);
});

gulp.task("js", function (cb) {
	pump([
		gulp.src(jsFiles),
		sourcemaps.init(),
		concat("all.js"),
		stripComments(),
		uglify(),
		sourcemaps.write("./"),
		gulp.dest("./js/dist")
	], cb);
});

gulp.task("watch", function () {
	gulp.watch(["./js/**/*.js","!./js/dist/all.js"], ["js"]);
	gulp.watch(["./sass/**/*.scss"], ["sass"]);
});

gulp.task("default", ["sass", "js", "watch"]);