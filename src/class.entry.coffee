uuid = require('node-uuid')

class Entry

  constructor: (data, options) ->
    metadata_str = data.split("<!-- METADATA -->")[0]
    metadata = JSON.parse(metadata_str)
    @title = metadata.title if metadata.title?
    @date = metadata.date if metadata.date?
    @excerpt = metadata.excerpt if metadata.excerpt?
    @content = data.split("<!-- METADATA -->\n")[1]
    @id = options.id if options.id?


module.exports = Entry