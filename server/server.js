var https = require("https");
var fs = require("fs");

var loopback = require('loopback');
var boot = require('loopback-boot');

var app = module.exports = loopback();

// SSL keys for https connection
var privateKey  = fs.readFileSync("sslcert/private-key.pem", "utf8");
var certificate = fs.readFileSync("sslcert/server.pem", "utf8");
var credentials = {
  key: privateKey,
  ca: [],
  cert: certificate
};

var path = require('path');
app.use('/client', loopback.static(path.resolve(__dirname, '../client/index.html')));
app.use('/client/js', loopback.static(path.resolve(__dirname, '../client/js')));

app.start = function() {
  // start the web server

  //var server = https
  //  .createServer(credentials, app)
  //  .listen(3009, "localhost", function () {
  //
  //    var baseUrl = 'https://' + app.get('host') + ':' + app.get('port');
  //    app.emit('started', baseUrl);
  //
  //    if (app.get('loopback-component-explorer')) {
  //      var explorerPath = app.get('loopback-component-explorer').mountPath;
  //      console.log('Browse your REST API at %s%s', baseUrl, explorerPath);
  //    }
  //  });


  return app.listen(function() {
    app.emit('started');
    var baseUrl = app.get('url').replace(/\/$/, '');
    console.log('Web server listening at: %s', baseUrl);
    if (app.get('loopback-component-explorer')) {
      var explorerPath = app.get('loopback-component-explorer').mountPath;
      console.log('Browse your REST API at %s%s', baseUrl, explorerPath);
    }
  });
};

// Bootstrap the application, configure models, datasources and middleware.
// Sub-apps like REST API are mounted via boot scripts.
boot(app, __dirname, function(err) {
  if (err) throw err;

  // start the server if `$ node server.js`
  if (require.main === module)
    app.start();
});
