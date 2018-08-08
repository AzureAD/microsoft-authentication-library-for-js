module.exports = function (grunt) {

    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
		
        file_append: {
            default_options: {
                files: [
                    {
                        prepend: "'use strict';\n",
                        input: 'dist/msal.js',
                        output: 'dist/msal.js'
                    },
                    {
                        prepend: "'use strict';\n",
                        input: 'dist/msal.min.js',
                        output: 'dist/msal.min.js'
                    }
                ]
            }
        },

        usebanner: {
            taskName: {
                options: {
                    position: 'top',
                    banner: '/*! <%= pkg.name %> v<%= pkg.version %> <%= grunt.template.today("yyyy-mm-dd") %> */\n',
                    linebreak: true
                },
                files: {
                    src: ['dist/msal.js', 'dist/msal.min.js']
                }
            }
        },

        tslint: {
            options: {
                // can be a configuration object or a filepath to tslint.json
                configuration: "tslint.json",
                // If set to true, tslint errors will be reported, but not fail the task
                // If set to false, tslint errors will be reported, and the task will fail
                force: true,
                fix: false
            },
            files: {
                src: [
                    "src/*.ts",
                ]
            }
        }
    });

    grunt.loadNpmTasks('grunt-file-append');
    grunt.loadNpmTasks('grunt-banner');
    grunt.loadNpmTasks("grunt-tslint");
    // uglify task is producing invalid js file
    grunt.registerTask('doc', ['typedoc']);
    grunt.registerTask('append', ['file_append']);
    grunt.registerTask('ts-lint', ['tslint']);
    grunt.registerTask('default', ['append', 'usebanner', 'ts-lint']);  
};
