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

gulp.task("sass", function (cb) {
	pump([
		gulp.src("./sass/**/*.scss"),
		sourcemaps.init(),
		sass({outputStyle: "nested"}).on("error", sass.logError),
		autoprefixer(),
		rename({ suffix: ".min" }),
		sourcemaps.write("./"),
		gulp.dest("./css/min")
	],
	cb);
});

gulp.task("js", function (cb) {
	pump([
		gulp.src(["./js/**/*.js","!./js/**/*.min.js"]),
		sourcemaps.init(),
		uglify(),
		rename({ suffix: ".min" }),
		sourcemaps.write("./"),
		gulp.dest("./js/min")
	],
	cb);
});

gulp.task("watch", function () {
	gulp.watch(["./js/**/*.js","!./js/**/*.min.js"], ["js"]);
	gulp.watch(["./sass/**/*.scss"], ["sass"]);
});