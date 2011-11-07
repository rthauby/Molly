express = require('express')
mu = require('mu')
path = require('path')

class BlogServer

  constructor: (options) ->
    @manager = options.blog_manager if options.blog_manager?
    this.init_mustache()
    this.init_express()


  init_mustache: ->
    mu.root = path.join(__dirname, '../templates/default')
    mu.compile 'index.mustache', (err, parsed) ->
      throw err if err
      
      
  init_express: ->
    @express_server = express.createServer()
    @express_server.basepath = __dirname
    @express_server.get '/', (req, res) =>
      Molly.IO.bark "Recived request for index"
      @manager.list_entries (entries) ->
        mu.render("index.mustache", {entries: entries})
          .on('data', (c) -> res.write(c))
          .on('end', -> res.end())
          
    @express_server.get '/entries/:id', (req, res) =>
      Molly.IO.bark "Recived request for an entry #{req.params.id}"
      res.send('entry ' + req.params.id);

    @express_server.listen(3000)
    Molly.IO.bark "I'm ready to serve your blog"

module.exports = BlogServer