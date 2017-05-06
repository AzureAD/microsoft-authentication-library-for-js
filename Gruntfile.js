module.exports = function (grunt) {

    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
		
        typedoc: {
		build: {
			options: {
				module: 'amd',
				out: './docs',
				target: 'es5'
			},
			src: ['./lib/**/*']
			}
		},
		
        uglify: {
            static_mappings: {
                // Because these src-dest file mappings are manually specified, every
                // time a new file is added or removed, the Gruntfile has to be updated.
                files: [
                  { src: 'out/msal.js', dest: 'out/msal.min.js' }
                ],
            }
        },

        file_append: {
            default_options: {
                files: [
                    {
                        prepend: "'use strict';\n",
                        input: 'out/msal.js',
                        output: 'out/msal.js'
                    }
                ]
            }
        },

        exec: {
            tsc: {
                command: 'tsc',
                stdout: false,
                stderr: false
            },
        },

        usebanner: {
            taskName: {
                options: {
                    position: 'top',
                    banner: '/*! <%= pkg.name %> v<%= pkg.version %> <%= grunt.template.today("yyyy-mm-dd") %> */\n',
                    linebreak: true
                },
                files: {
                    src: ['out/msal.js', 'out/msal.min.js']
                }
            }
        }
    });

    // Load the plugin that provides the "uglify" task.
    grunt.loadNpmTasks('grunt-typedoc');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-exec');
    grunt.loadNpmTasks('grunt-file-append');
    grunt.loadNpmTasks('grunt-banner');
    // uglify task is producing invalid js file
    grunt.registerTask('doc', ['typedoc']);
    grunt.registerTask('minify', ['uglify']);
    grunt.registerTask('build', ['exec', 'file_append', 'uglify', 'usebanner']);  
};
