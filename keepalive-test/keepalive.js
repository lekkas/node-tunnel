var http = require('http');
var should = require('should')

getInt = function(env, defaultVal) {
  if (process.env[env] === undefined) {
    return defaultVal;
  }
  return parseInt(process.env[env]);
}

describe('KeepAlive Agent', function() {
  this.timeout(60000);
  it('should finish without error', function(done) {
    var serverPort = 8082;
    var clientConnect = 0;
    var N = getInt('N', 10);
    var sockets = getInt('SOCKETS', Infinity);
    var keepAlive = !!process.env.ALIVE || false;
    var server1;
    var server2;
    var options = {keepAlive: keepAlive, maxSockets: sockets};
    var agent = new http.Agent(options);

    server1 = http.createServer(function(req, res) {
      console.log('header: ', req.headers);
      res.writeHead(200);
      res.end('Hello' + req.url);
    });
    server1.listen(serverPort, function() {
      server2 = http.createServer(function(req, res) {
        //console.log('header: ', req.headers);
        res.writeHead(200);
        res.end('Hello' + req.url);
      });
      server2.listen(serverPort + 1, runClientTests);
    });


    function runClientTests() {
      //var agent = new http.Agent({keepAlive: true, maxSockets: 1});

      for (var i = 0; i < N; ++i) {
        doClientRequest(i);
      }

      function doClientRequest(i) {
        setTimeout(function() {
          var reqOpts = {
            port: serverPort + (i % 2),
            path: '/' + i,
            agent: agent
          };
          var req = http.get(reqOpts, function(res) {
            console.log(res.socket.localPort + ' -> ' + reqOpts.port)
            res.setEncoding('utf8');
            res.on('data', function(data) {
              data.should.equal('Hello/' + i);
            });
            res.on('end', function() {
              ++clientConnect;
              if (clientConnect === N) {
                //server1.close();
                //server2.close();
                console.log (options);
                //done();
              }
            });
          });
        }, i * 1000);
      }
    }
  });
});
