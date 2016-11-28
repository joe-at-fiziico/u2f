var VirtualToken = require('virtual-u2f');

var token = new VirtualToken();

module.exports = function(Token) {

  register(Token);
  sign(Token);
};

function register(Token) {
  Token.register = function(appId, challenge, keyHandle, callback) {

    var req = {
      "type": "u2f_register_request",
      "appId": appId,
      "registerRequests": [{
        "version": Token.app.get('u2fVersion'),
        "challenge": challenge
      }]
    };

    if (keyHandle !== undefined) {
      req.registeredKeys = [{
        "version": Token.app.get('u2fVersion'),
        "keyHandle": keyHandle,
        "appId": appId
      }];
    }

    console.log('+++token.HandleRegisterRequest : %j', req);

    token.HandleRegisterRequest(req)
      .then(function(resp) {

        console.log('+++token.HandleRegisterRequest response: %j', resp);
        //Ex: {
        //  "registrationData": "BQTRDqoPQbiFRLHWyq1Nd2d_WQ6ezSauvHvS-Sfj-UlsX9qefFfV4kdfXn6h87B-HBEYieh2YwAFFNAfJra_KhgbEDDPUhyU35R-rEKPYvqFjQAwggG0MIIBWKADAgECAgEBMAwGCCqGSM49BAMCBQAwYTELMAkGA1UEBhMCREUxJjAkBgNVBAoMHVVudHJ1c3R3b3J0aHkgQ0EgT3JnYW5pc2F0aW9uMQ8wDQYDVQQIDAZCZXJsaW4xGTAXBgNVBAMMEFVudHJ1c3R3b3J0aHkgQ0EwIhgPMjAxNDA5MjQxMjAwMDBaGA8yMTE0MDkyNDEyMDAwMFowXjELMAkGA1UEBhMCREUxITAfBgNVBAoMGHZpcnR1YWwtdTJmLW1hbnVmYWN0dXJlcjEPMA0GA1UECAwGQmVybGluMRswGQYDVQQDDBJ2aXJ0dWFsLXUyZi12MC4wLjEwWTATBgcqhkjOPQIBBggqhkjOPQMBBwNCAATDyR8lLiAQe16N6rGQIJj3KHBx5FQYuJjOX_F8pyWueMM8xwHAdGARy7u1iwi2HSDAXnXVAaP496FnP74yY66-MAwGCCqGSM49BAMCBQADSAAwRQIhAI65IFeh80FPG3kaWOYHq6RmHJNh-8S6iWVcijvsEGjaAiAVkKh28IBH32COI7IqoKrSSw1JyXUzAK8ytpBz8KGk2zBFAiAaDGkasJozhBeNGXX4ZeQQtaWs8R1YRtRyZpGd3IJFOQIhAMhZoM12EpkTLq3RrOaAJt3gObN3Lw-nCEKtc2OFJRNh",
        //  "clientData": "eyJjaGFsbGVuZ2UiOiJwRmdKeXVGR05XNkRyMzlYYUNHQ2ttdTRqaGlmUHpfTXRSa0Y0SGpZeFQ4In0=",
        //  "keyHandle": ????????? "30cf521c94df947eac428f62fa858d00"
        //}
        return callback(null, {
            "registrationData": resp.registrationData,
            "clientData": resp.clientData,
            "keyHandle": resp.keyHandle
        });
      }, function(err) {
        console.log('+++token.HandleSignRequest error: %s', err);
        return callback(err);
      }
    );
  };

  Token.remoteMethod(
    'register',
    {
      description: 'Registration request',
      accepts: [
        {arg: 'appId', type: 'string', description: 'App ID', required: true},
        {arg: 'challenge', type: 'string', description: 'challenge', required: true},
        {arg: 'keyHandle', type: 'string', description: 'keyHandle', required: false}
      ],
      returns: {type: 'object', root: true},
      http: [
        {verb: 'post', path: '/register'}
      ]
    }
  );
}

function sign(Token) {
  Token.sign = function(appId, challenge, keyHandle, callback) {

    var req = {
      "type": "u2f_sign_request",
      "appId": appId,
      "challenge": challenge,
      "registeredKeys": [{
        "version": Token.app.get('u2fVersion'),
        "keyHandle": keyHandle,
        "appId": appId
      }]
      //timeoutSeconds: 10,
      //‘requestId’: <unique integer>  // optional
    };

    console.log('+++token.HandleSignRequest : %j', req);

    var resp = token.HandleSignRequest(req)
      .then(function(resp) {

        //Ex: {
        //  "clientData": "eyJjaGFsbGVuZ2UiOiJpSS8wa2FLUnpsT3lQeTB0d3lpRlNjaU02TEIwZXNSUWNUWHhBaE1tenZnPSJ9",
        //  "signatureData": "AQAAAAAwRQIgLYmhN3dFwYDsGasCl9roCtpGQELv9YGggh9MzH4choACIQDycIzzmldjITDgvOx3dj9rArPHZSx9yUmGH1zRTeVSeA",
        //  "challenge": "{\"challenge\":\"iI/0kaKRzlOyPy0twyiFSciM6LB0esRQcTXxAhMmzvg=\"}",
        //  "appId": "https://localhost:3009",
        //  "keyHandle": "MM9SHJTflH6sQo9i-oWNAA"
        //}
        console.log('+++token.HandleSignRequest response: %j', resp);

        return callback(null, {
            "keyHandle": resp.keyHandle,
            "signatureData": resp.signatureData,
            "clientData": resp.clientData
        });
      }, function(err) {
        console.log('+++token.HandleSignRequest error: %s', err);
        return callback(err);
      }
    );
  };

  Token.remoteMethod(
    'sign',
    {
      description: 'Sign-in request',
      accepts: [
        {arg: 'appId', type: 'string', description: 'App ID', required: true},
        {arg: 'challenge', type: 'string', description: 'challenge', required: true},
        {arg: 'keyHandle', type: 'string', description: 'keyHandle', required: true}
      ],
      returns: {type: 'object', root: true},
      http: [
        {verb: 'post', path: '/sign'}
      ]
    }
  );
}
