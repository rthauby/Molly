class Entry

  constructor: (data) ->
    metadata_str = data.split("<!-- METADATA -->")[0]
    metadata = JSON.parse(metadata_str)
    @title = metadata.title if metadata.title?
    @date = metadata.date if metadata.date?
    @excerpt = metadata.excerpt if metadata.excerpt?
    @content = data.split("<!-- METADATA -->\n")[1]


Molly = _.extend({}, Molly, {Entry: Entry})