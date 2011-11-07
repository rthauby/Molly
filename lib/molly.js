(function() {
  var BlogManager, BlogServer, Configurator, Entry, IO, Molly, bg, colors, configurator, express, fs, mu, oauth, path, program, server, sys, uuid, _;
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };
  _ = require('underscore');
  fs = require('fs');
  oauth = require('oauth');
  BlogManager = (function() {
    function BlogManager(options) {
      this.configurator = new Configurator();
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
            var id;
            id = config.path.replace("/", "");
            entries.push(new Entry(data, {
              id: id
            }));
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
  module.exports = BlogManager;
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
    Configurator.prototype.configure = function() {
      return Molly.IO.ask("What's your dropbox app key?", __bind(function(data) {
        var app_key;
        app_key = data;
        return Molly.IO.ask("What's your dropbox app secret?", __bind(function(data) {
          var app_secret, config;
          app_secret = data;
          config = {
            app_key: app_key,
            app_secret: app_secret
          };
          return this.get_access_token();
        }, this));
      }, this));
    };
    return Configurator;
  })();
  module.exports = Configurator;
  uuid = require('node-uuid');
  Entry = (function() {
    function Entry(data, options) {
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
      if (options.id != null) {
        this.id = options.id;
      }
    }
    return Entry;
  })();
  module.exports = Entry;
  express = require('express');
  mu = require('mu');
  path = require('path');
  BlogServer = (function() {
    function BlogServer(options) {
      if (options.blog_manager != null) {
        this.manager = options.blog_manager;
      }
      this.init_mustache();
      this.init_express();
    }
    BlogServer.prototype.init_mustache = function() {
      mu.root = path.join(__dirname, '../templates/default');
      return mu.compile('index.mustache', function(err, parsed) {
        if (err) {
          throw err;
        }
      });
    };
    BlogServer.prototype.init_express = function() {
      this.express_server = express.createServer();
      this.express_server.basepath = __dirname;
      this.express_server.get('/', __bind(function(req, res) {
        Molly.IO.bark("Recived request for index");
        return this.manager.list_entries(function(entries) {
          return mu.render("index.mustache", {
            entries: entries
          }).on('data', function(c) {
            return res.write(c);
          }).on('end', function() {
            return res.end();
          });
        });
      }, this));
      this.express_server.get('/entries/:id', __bind(function(req, res) {
        Molly.IO.bark("Recived request for an entry " + req.params.id);
        return res.send('entry ' + req.params.id);
      }, this));
      this.express_server.listen(3000);
      return Molly.IO.bark("I'm ready to serve your blog");
    };
    return BlogServer;
  })();
  module.exports = BlogServer;
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
    bg = new BlogManager();
    server = new BlogServer({
      blog_manager: bg
    });
  } else if (program.configure) {
    configurator = new Configurator();
    configurator.configure();
  }
}).call(this);
