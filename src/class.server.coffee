express = require('express')

class BlogServer
  
  constructor: (options) ->
    @manager = options.blog_manager if options.blog_manager?
    app = express.createServer()
    
    app.get '/', (req, res) =>
      Molly.IO.bark "Recived request"
      @manager.list_entries (entries) ->
        res.send(entries)
    
    app.listen(3000)
    Molly.IO.bark "I'm ready to serve your blog"
  
Molly = _.extend({}, Molly, {BlogServer: BlogServer})