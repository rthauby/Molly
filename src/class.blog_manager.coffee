_ =       require('underscore')
fs =      require('fs')
oauth =   require('oauth')

class BlogManager

  constructor: (options) ->
    @configurator = new Configurator()


  get_uid: (callback) ->
    config = @configurator.config
    oauth = @configurator.oauth
    oauth.getProtectedResource "https://api.dropbox.com/1/account/info", "GET", config.oauth_access_token, config.oauth_access_token_secret, (error, data, response) ->
      data = JSON.parse(data)
      callback(data.uid) if callback?


  list_files: (path, callback) ->
    config = @configurator.config
    oauth = @configurator.oauth
    oauth.getProtectedResource "https://api.dropbox.com/1/metadata/sandbox#{path}", "GET", config.oauth_access_token, config.oauth_access_token_secret, (error, data, response) ->
      data = JSON.parse(data)
      callback(data.contents) if callback?
      
      
  get_file: (path, callback) ->
    config = @configurator.config
    oauth = @configurator.oauth
    oauth.getProtectedResource "https://api-content.dropbox.com/1/files/sandbox#{path}", "GET", config.oauth_access_token, config.oauth_access_token_secret, (error, data, response) ->
      callback(data) if callback?


  list_entries: (callback) ->
    this.list_files "/entries", (configs) =>
      entries = []
      total = configs.length
      current = 0
      _.each configs, (config) =>
        this.get_file "#{config.path}", (data) =>
          id = config.path.replace("/","")
          entries.push new Entry(data,{id:id})
          current++
          callback(entries) if callback? && current == total


module.exports = BlogManager