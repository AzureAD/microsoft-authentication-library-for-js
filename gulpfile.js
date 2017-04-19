/// <binding AfterBuild='TSLint:All' ProjectOpened='TSLint:Watch' />
//Node packages
var gulp = require("gulp");
var plumber = require("gulp-plumber");
var tslint = require("gulp-tslint");

//Paths to include/exclude
var TYPE_SCRIPT_FILES = ["lib/**/*.ts", "!node_modules/**"];

//Our TSLint settings
var TYPE_SCRIPT_REPORT = tslint.report({ summarizeFailureOutput: true });

//The actual task to run
gulp.task("TSLint:All", function () {
    return gulp.src(TYPE_SCRIPT_FILES)
        .pipe(plumber())
        .pipe(tslint({ formatter: "msbuild" }))
        .pipe(TYPE_SCRIPT_REPORT);
});