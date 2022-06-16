'use strict';

module.exports = function loadGrunt(grunt) {
  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    nodeunit: {
      files: ['test/Nodeunit_test/*_test.js'],
    },
    mochaTest: {
      test: {
        options: {
          reporter: 'spec',
          clearRequireCache: true
        },
        src: ['test/Chai-passport_test/*_test.js'],
      },
    }
  });

  // These plugins provide necessary tasks.
  grunt.loadNpmTasks('grunt-contrib-nodeunit');
  grunt.loadNpmTasks('grunt-mocha-test');

  grunt.registerTask('printMsg_nodeunit', () => {
    grunt.log.writeln('\n\n\n======= Running tests in test/nodeunit_test =======\n\n\n');
  });
  grunt.registerTask('printMsg_chai-passport', () => {
    grunt.log.writeln('\n\n\n======= Running tests in test/chai-passport_test =======\n\n\n');
  });
  grunt.registerTask('printMsg_end_to_end_Test', () => {
    grunt.log.writeln('\n\n\n======= Running end to end tests in test/End_to_end_test =======\n\n\n');
  });
  grunt.registerTask('end_to_end_test', () => {
    grunt.config('mochaTest.test.src', 'test/End_to_end_test/*_test.js');
    grunt.task.run(['mochaTest']);
  });
  grunt.registerTask('e2e', ['printMsg_end_to_end_Test', 'end_to_end_test']);
  grunt.registerTask('run_tests_with_e2e', ['printMsg_chai-passport', 'mochaTest', 'printMsg_nodeunit', 'nodeunit', 'printMsg_end_to_end_Test', 'end_to_end_test']);
  grunt.registerTask('run_tests', ['printMsg_chai-passport', 'mochaTest', 'printMsg_nodeunit', 'nodeunit']);  
  grunt.registerTask('default', 'run_tests');
};
