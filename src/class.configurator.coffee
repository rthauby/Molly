_ =       require('underscore')
fs =      require('fs')
oauth =   require('oauth')

class Configurator

  constructor: (options) ->
    if options?
      @config = options.config if options.config?
    else
      @config = this.read_config()
    @oauth = new oauth.OAuth("https://api.dropbox.com/1/oauth/request_token", "https://api.dropbox.com/1/oauth/access_token", @config.app_key, @config.app_secret, "1.0", null, "HMAC-SHA1")


  read_config: ->
    config_str = fs.readFileSync("config.json").toString()
    config = JSON.parse(config_str)
    return config


  write_config: ->
    config_str = JSON.stringify(@config)
    fs.writeFileSync "config.json", config_str


  get_access_token: =>
    @oauth.getOAuthRequestToken (err, token, token_secret, parsedQueryString) =>
      if(err)
        sys.puts('error :' + err)
      else
        parsed_url = @oauth.signUrl("https://www.dropbox.com/1/oauth/authorize", token,  token_secret, "GET")
        Molly.IO.bark "Would you kindly go to the following URL and authorize the app? When you're done, just hit ENTER. I'll wait right here"
        Molly.IO.ask "#{parsed_url}", (data) =>
          @oauth.getOAuthAccessToken token, token_secret, (error, oauth_access_token, oauth_access_token_secret, results2) =>
            if(error)
              Molly.IO.bark "Ay, there was a problem: #{sys.inspect(error)}"
            else if !_.isEmpty(oauth_access_token) && !_.isEmpty(oauth_access_token_secret)
                @config = {
                  "oauth_access_token":         oauth_access_token,
                  "oauth_access_token_secret":  oauth_access_token_secret
                  "app_key":                    @config.app_key
                  "app_secret":                 @config.app_secret
                }
                this.write_config()
                Molly.IO.bark "I saved the config file as config.json"
            process.exit()

Molly = _.extend({}, Molly, {Configurator: Configurator})

Molly.Configurator::configure = ->
  Molly.IO.ask "What's your dropbox app key?", (data) =>
    app_key = data
    Molly.IO.ask "What's your dropbox app secret?", (data) =>
      app_secret = data
      config = {
        app_key: app_key
        app_secret: app_secret
      }
      configurator = new Molly.Configurator({config: config})
      configurator.get_access_token()