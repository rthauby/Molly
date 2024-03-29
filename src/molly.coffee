colors =  require('colors')
sys =     require('sys')
_ =       require('underscore')
program = require('commander')

program
  .version('0.0.1')
  .option('-s, --server', 'Start the blog server')
  .option('-c, --configure', 'Configure Molly for your DropBox settings')

program.parse(process.argv)

if program.server
  bg = new BlogManager()
  server = new BlogServer({blog_manager: bg})
else if program.configure
  configurator = new Configurator()
  configurator.configure()