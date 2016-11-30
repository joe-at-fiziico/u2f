var VirtualToken = require('virtual-u2f');

var buildInKeys = [
  {
    generated: 'Wed Nov 30 2016 16:15:45 GMT+0800 (CST)',
    appId: 'https://localhost:3009',
    keyHandle: 'bb94833fe3db0c5dcf3ebe1eb113c77d',
    public: '0429576802212f659b9855c3438a01abbef48f654568ffb16bc1e8151dfbec0a481180cbca35cfe23a3fd862cf39903da77521bfac330b061d726df71a5a5f8c13',
    private: '634504cc66cbd7f89d0386eaa4d6d0659ad755e625f6f41e3233729f90fe23b8',
    counter: 2
  }
];

var token = new VirtualToken(buildInKeys);

module.exports = function(Token) {

  register(Token);
  sign(Token);

  command(Token);
};

var U2F_GET_API_REQUEST = 'u2f_get_api_version_request';
var U2F_REGISTER_REQUEST = 'u2f_register_request';
var U2F_SIGN_REQUEST = 'u2f_sign_request';

var U2F_GET_API_RESPONSE = 'u2f_get_api_version_response';
var U2F_REGISTER_RESPONSE = 'u2f_register_response';
var U2F_SIGN_RESPONSE = 'u2f_sign_response';


function hextob64(data) {
  // Pad out as required
  if (data.length % 2 != 0) {
    data = data + "0";
  }
  // Create standard b64 encoding
  var b64 =  new Buffer(data, 'hex').toString('base64');
  // Format to web safe b64
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function command(Token) {

  function signRequestHandler(req, callback) {
    console.log('+++token.HandleSignRequest : %j', req);

    var resp = token.HandleSignRequest(req)
      .then(function(resp) {
        console.log('+++token.HandleSignRequest response: %j', resp);

        return callback(null, {
          "requestId": req.requestId,
          "responseData": {
            "keyHandle": resp.keyHandle,
            "signatureData": resp.signatureData,
            "clientData": resp.clientData
          },
          "type": U2F_SIGN_RESPONSE
        });
      }, function(err) {
        console.log('+++token.HandleSignRequest error: %j', err);
        return callback(err);
      }
    );
  }

  function registerRequestHandler(req, callback) {
    console.log('+++token.HandleRegisterRequest : %j', req);

    token.HandleRegisterRequest(req)
      .then(function(resp) {
        console.log('+++token.HandleRegisterRequest response: %j', resp);

        return callback(null, {
          "requestId": req.requestId,
          "responseData": {
            "registrationData": resp.registrationData,
            "clientData": resp.clientData,
            "version": Token.app.get('u2fVersion'),

            //TODO: spec definition?
            "keyHandle": resp.keyHandle,
            "challenge": req.registerRequests[0].challenge
          },
          "type": U2F_REGISTER_RESPONSE
        });
      }, function(err) {
        console.log('+++token.HandleSignRequest error: %s', err);
        return callback(err);
      }
    );
  }

  Token.command = function(type, requestId, appId, challenge, registerRequests, registeredKeys, version, timeoutSeconds, callback) {

    // 1. verify parameters
    var req;
    if (type === U2F_SIGN_REQUEST) {
      req = {
        "type": U2F_SIGN_REQUEST,
        "requestId": requestId,
        "appId": appId,
        "challenge": challenge,
        "registeredKeys": registeredKeys,
        "timeoutSeconds": timeoutSeconds
      };

      signRequestHandler(req, callback);
    }
    else if (type === U2F_REGISTER_REQUEST) {
      req = {
        "type": U2F_REGISTER_REQUEST,
        "requestId": requestId,
        "appId": appId,
        "registerRequests": registerRequests,
        "registeredKeys": registeredKeys
      };

      registerRequestHandler(req, callback);
    }
    else if (type === U2F_GET_API_REQUEST) {
      return callback(null, {
        "requestId": requestId,
        "responseData": {
          "js_api_version": 1.1
        },
        "type": U2F_GET_API_RESPONSE
      });
    }
    else {
      console.log('Unknown type: ' + type);
      return callback('Unknown type: ' + type);
    }
  };

  Token.remoteMethod(
    'command',
    {
      description: 'U2F command',
      accepts: [
        {arg: 'type', type: 'string', description: 'Type', required: true},
        {arg: 'requestId', type: 'number', description: 'requestId', required: true},
        {arg: 'appId', type: 'string', description: 'appId', required: false},
        {arg: 'challenge', type: 'string', description: 'challenge', required: false},
        {arg: 'registerRequests', type: 'array', description: 'challenge', required: false},
        {arg: 'registeredKeys', type: 'array', description: 'keyHandle', required: false},
        {arg: 'version', type: 'string', description: 'version', required: false},
        {arg: 'timeoutSeconds', type: 'number', description: 'timeout seconds', required: false}
      ],
      returns: {type: 'object', root: true},
      http: [
        {verb: 'post', path: '/command'}
      ]
    }
  );
}

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
