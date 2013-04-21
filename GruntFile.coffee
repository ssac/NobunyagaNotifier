module.exports = (grunt)->

  grunt.initConfig
    uglify:
      build:
        files:
          'deploy/bg.js'   : 'deploy/bg.js'
          'deploy/cs.js'   : 'deploy/cs.js'
          'deploy/popup.js': 'deploy/popup.js'

    zip:
      deploy:
        src: ['deploy/*']
        dest: 'deploy.zip'
        # compression: 'DEFLATE'
        # base64: true

  grunt.registerTask 'copyfiles', ->
    if grunt.file.exists 'deploy/'
      grunt.file.delete 'deploy/'
    else
      grunt.log.write 'deploy dir does not exist.\n'

    grunt.file.recurse 'dev/', (abspath, rootdir, subdir, filename)->
      if subdir
        grunt.file.copy abspath, "deploy/#{ subdir }/#{ filename }"
      else
        grunt.file.copy abspath, "deploy/#{ filename }"

    grunt.log.write 'Copied all dev files\n'

  grunt.registerTask 'clean', ->
    if grunt.file.exists 'deploy/'
      grunt.file.delete 'deploy/'

  grunt.registerTask 'deploy', ->
    grunt.task.run ['copyfiles', 'uglify']

  grunt.loadNpmTasks 'grunt-contrib-uglify'
  grunt.loadNpmTasks 'grunt-zip'