/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

module.exports = function (grunt) {

    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON("package.json"),
        clean: ["build/"],
        jsdoc: {
            dist: {
                src: ["lib/*.js"],
                options: {
                    destination: "ref"
                }
            }
        },
        jshint: {
            src: {
                options: {
                    jshintrc: ".jshintrc"
                },
                src: ["lib/*.js"]
            }
        },
        jasmine_node: {
            options: {
                forceExit: true,
                match: ".",
                matchall: false,
                extensions: "js",
                specNameMatcher: "spec",
                jUnit: {
                    report: true,
                    savePath: "./build/reports/jasmine/",
                    useDotNotation: true,
                    consolidate: true
                }
            },
            all: ["tests/unit/spec/"]
        },
        uglify: {
            options: {
                banner: "/*! <%= pkg.name %> v<%= pkg.version %> <%= grunt.template.today(\"yyyy-mm-dd\") %> */\n"
            },
            static_mappings: {
                /*
                 * Because these src-dest file mappings are manually specified, every
                 * time a new file is added or removed, the Gruntfile has to be updated.
                 */
                files: [
                    { src: "lib/adal.js", dest: "build/adal.min.js" },
                    { src: "lib/adal-angular.js", dest: "build/adal-angular.min.js" },
                ],
            }
        },
    });

    // Load the plugin that provides the "uglify" task.
    grunt.loadNpmTasks("grunt-jsdoc");
    grunt.loadNpmTasks("grunt-contrib-jshint");
    grunt.loadNpmTasks("grunt-contrib-uglify");
    grunt.loadNpmTasks("grunt-jasmine-node");
    // uglify task is producing invalid js file

    // jasmine node directly js api 
    grunt.registerTask("default", ["jshint", "jasmine_node"]);
    grunt.registerTask("doc", ["jsdoc"]);
    grunt.registerTask("minify", ["uglify"]);
    
};
