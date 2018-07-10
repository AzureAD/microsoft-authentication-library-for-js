var gulp = require('gulp');
var karma = require('gulp-karma');

var allFiles = [
    'node_modules/angular/angular.js',
    'node_modules/angular-mocks/angular-mocks.js',
    'node_modules/angular-route/angular-route.js',
    'node_modules/angular-resource/angular-resource.js',
    'node_modules/angular-ui-router/release/angular-ui-router.js',
    'dist/msal-angular.js',
    'tests/testApp.js',
    'tests/angularModuleSpec.js'
];

gulp.task('test', function (coverage) {
    gulp.src(allFiles)
        .pipe(karma({
            browsers: ['ChromeHeadlessNoSandbox'],
            configFile: 'karma.conf.js',
            action: 'run'
        }))
        .on('error', function (err) {
            // Make sure failed tests cause gulp to exit non-zero
            throw err;
        });
});