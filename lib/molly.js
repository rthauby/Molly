(function() {
  var BlogManager, BlogServer, Configurator, Entry, IO, Molly, bg, colors, express, fs, oauth, program, server, sys, _;
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };
  _ = require('underscore');
  fs = require('fs');
  oauth = require('oauth');
  BlogManager = (function() {
    function BlogManager(options) {
      this.configurator = new Molly.Configurator();
    }
    BlogManager.prototype.get_uid = function(callback) {
      var config;
      config = this.configurator.config;
      oauth = this.configurator.oauth;
      return oauth.getProtectedResource("https://api.dropbox.com/1/account/info", "GET", config.oauth_access_token, config.oauth_access_token_secret, function(error, data, response) {
        data = JSON.parse(data);
        if (callback != null) {
          return callback(data.uid);
        }
      });
    };
    BlogManager.prototype.list_files = function(path, callback) {
      var config;
      config = this.configurator.config;
      oauth = this.configurator.oauth;
      return oauth.getProtectedResource("https://api.dropbox.com/1/metadata/sandbox" + path, "GET", config.oauth_access_token, config.oauth_access_token_secret, function(error, data, response) {
        data = JSON.parse(data);
        if (callback != null) {
          return callback(data.contents);
        }
      });
    };
    BlogManager.prototype.get_file = function(path, callback) {
      var config;
      config = this.configurator.config;
      oauth = this.configurator.oauth;
      return oauth.getProtectedResource("https://api-content.dropbox.com/1/files/sandbox" + path, "GET", config.oauth_access_token, config.oauth_access_token_secret, function(error, data, response) {
        if (callback != null) {
          return callback(data);
        }
      });
    };
    BlogManager.prototype.list_entries = function(callback) {
      return this.list_files("/entries", __bind(function(configs) {
        var current, entries, total;
        entries = [];
        total = configs.length;
        current = 0;
        return _.each(configs, __bind(function(config) {
          return this.get_file("" + config.path, __bind(function(data) {
            entries.push(new Entry(data));
            current++;
            if ((callback != null) && current === total) {
              return callback(entries);
            }
          }, this));
        }, this));
      }, this));
    };
    return BlogManager;
  })();
  Molly = _.extend({}, Molly, {
    BlogManager: BlogManager
  });
  _ = require('underscore');
  fs = require('fs');
  oauth = require('oauth');
  Configurator = (function() {
    function Configurator(options) {
      this.get_access_token = __bind(this.get_access_token, this);      if (options != null) {
        if (options.config != null) {
          this.config = options.config;
        }
      } else {
        this.config = this.read_config();
      }
      this.oauth = new oauth.OAuth("https://api.dropbox.com/1/oauth/request_token", "https://api.dropbox.com/1/oauth/access_token", this.config.app_key, this.config.app_secret, "1.0", null, "HMAC-SHA1");
    }
    Configurator.prototype.read_config = function() {
      var config, config_str;
      config_str = fs.readFileSync("config.json").toString();
      config = JSON.parse(config_str);
      return config;
    };
    Configurator.prototype.write_config = function() {
      var config_str;
      config_str = JSON.stringify(this.config);
      return fs.writeFileSync("config.json", config_str);
    };
    Configurator.prototype.get_access_token = function() {
      return this.oauth.getOAuthRequestToken(__bind(function(err, token, token_secret, parsedQueryString) {
        var parsed_url;
        if (err) {
          return sys.puts('error :' + err);
        } else {
          parsed_url = this.oauth.signUrl("https://www.dropbox.com/1/oauth/authorize", token, token_secret, "GET");
          Molly.IO.bark("Would you kindly go to the following URL and authorize the app? When you're done, just hit ENTER. I'll wait right here");
          return Molly.IO.ask("" + parsed_url, __bind(function(data) {
            return this.oauth.getOAuthAccessToken(token, token_secret, __bind(function(error, oauth_access_token, oauth_access_token_secret, results2) {
              if (error) {
                Molly.IO.bark("Ay, there was a problem: " + (sys.inspect(error)));
              } else if (!_.isEmpty(oauth_access_token) && !_.isEmpty(oauth_access_token_secret)) {
                this.config = {
                  "oauth_access_token": oauth_access_token,
                  "oauth_access_token_secret": oauth_access_token_secret,
                  "app_key": this.config.app_key,
                  "app_secret": this.config.app_secret
                };
                this.write_config();
                Molly.IO.bark("I saved the config file as config.json");
              }
              return process.exit();
            }, this));
          }, this));
        }
      }, this));
    };
    return Configurator;
  })();
  Molly = _.extend({}, Molly, {
    Configurator: Configurator
  });
  Molly.Configurator.prototype.configure = function() {
    return Molly.IO.ask("What's your dropbox app key?", __bind(function(data) {
      var app_key;
      app_key = data;
      return Molly.IO.ask("What's your dropbox app secret?", __bind(function(data) {
        var app_secret, config, configurator;
        app_secret = data;
        config = {
          app_key: app_key,
          app_secret: app_secret
        };
        configurator = new Molly.Configurator({
          config: config
        });
        return configurator.get_access_token();
      }, this));
    }, this));
  };
  Entry = (function() {
    function Entry(data) {
      var metadata, metadata_str;
      metadata_str = data.split("<!-- METADATA -->")[0];
      metadata = JSON.parse(metadata_str);
      if (metadata.title != null) {
        this.title = metadata.title;
      }
      if (metadata.date != null) {
        this.date = metadata.date;
      }
      if (metadata.excerpt != null) {
        this.excerpt = metadata.excerpt;
      }
      this.content = data.split("<!-- METADATA -->\n")[1];
    }
    return Entry;
  })();
  Molly = _.extend({}, Molly, {
    Entry: Entry
  });
  express = require('express');
  BlogServer = (function() {
    function BlogServer(options) {
      var app;
      if (options.blog_manager != null) {
        this.manager = options.blog_manager;
      }
      app = express.createServer();
      app.get('/', __bind(function(req, res) {
        Molly.IO.bark("Recived request");
        return this.manager.list_entries(function(entries) {
          return res.send(entries);
        });
      }, this));
      app.listen(3000);
      Molly.IO.bark("I'm ready to serve your blog");
    }
    return BlogServer;
  })();
  Molly = _.extend({}, Molly, {
    BlogServer: BlogServer
  });
  IO = (function() {
    function IO() {}
    IO.prototype.bark = function(msg) {
      return sys.puts("> Molly: ".green + msg + ". Woof!");
    };
    IO.prototype.ask = function(question, callback) {
      var stdin, stdout;
      this.bark(question);
      stdin = process.stdin;
      stdout = process.stdout;
      stdin.resume();
      return stdin.once('data', function(data) {
        data = data.toString().trim();
        if (callback != null) {
          return callback(data);
        }
      });
    };
    return IO;
  })();
  Molly = _.extend({}, Molly, {
    IO: new IO()
  });
  colors = require('colors');
  sys = require('sys');
  _ = require('underscore');
  program = require('commander');
  program.version('0.0.1').option('-s, --server', 'Start the blog server').option('-c, --configure', 'Configure Molly for your DropBox settings');
  program.parse(process.argv);
  if (program.server) {
    bg = new Molly.BlogManager();
    server = new Molly.BlogServer({
      blog_manager: bg
    });
  } else if (program.configure) {
    Molly.Configurator.prototype.configure();
  }
}).call(this);
