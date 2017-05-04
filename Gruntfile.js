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
            options: {
                banner: '/*! <%= pkg.name %> v<%= pkg.version %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
            },
            static_mappings: {
                // Because these src-dest file mappings are manually specified, every
                // time a new file is added or removed, the Gruntfile has to be updated.
                files: [
                  { src: 'out/msal.js', dest: 'build/msal.min.js' }
                ],
            }
        },
    });

    // Load the plugin that provides the "uglify" task.
    grunt.loadNpmTasks('grunt-typedoc');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    // uglify task is producing invalid js file
    grunt.registerTask('doc', ['typedoc']);
    grunt.registerTask('minify', ['uglify']);
    
};