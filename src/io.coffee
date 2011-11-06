class IO

  bark: (msg) ->
    sys.puts "> Molly: ".green + msg + ". Woof!"


  ask: (question, callback) ->
    this.bark question
    stdin = process.stdin
    stdout = process.stdout
    stdin.resume();
    stdin.once 'data', (data) ->
      data = data.toString().trim();
      callback(data) if callback?

Molly = _.extend({}, Molly, {IO: new IO()})