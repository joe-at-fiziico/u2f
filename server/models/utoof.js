var u2fLib= require("authdog");

module.exports = function(U2f) {

  registrationRequest(U2f);
  registrationResponse(U2f);
  signRequest(U2f);
  signResponse(U2f);
};

function registrationRequest(U2f) {
  U2f.registrationRequest = function(appId, keyHandle, callback) {

    var registeredKeys = [];
    if (keyHandle !== undefined) {
      registeredKeys.push({
        keyHandle: keyHandle
      })
    }

    u2fLib.startRegistration(appId, registeredKeys)
      .then(function(request) {
        console.log('---u2fLib.startRegistration response: %j', request);
        return callback(null, request);
    }, function(err) {
        console.log(err);
        return callback(err);
      });
  };

  U2f.remoteMethod(
    'registrationRequest',
    {
      description: 'Registration request',
      accepts: [
        {arg: 'appId', type: 'string', description: 'App ID', required: true},
        {arg: 'keyHandle', type: 'string', description: 'keyHandle', required: false}
      ],
      returns: {type: 'object', root: true},
      http: [
        {verb: 'get', path: '/register'}
      ]
    }
  );
}

function registrationResponse(U2f) {
  U2f.registrationResponse = function(challenge, clientData, registrationData, version, keyHandle, callback) {

    var registrationRequest =
    {
      appId: U2f.app.get('appID'),
      "type": "u2f_register_request",
      "registerRequests": [
      {
        "version": U2f.app.get('u2fVersion'),
        "challenge": challenge
      }
    ],
      "registeredKeys": [{
        keyHandle: keyHandle
      }]
    };

    var registrationResponse =
    {
      challenge: challenge,
      clientData: clientData,
      registrationData: registrationData,
      version: version
    };

    console.log('---u2fLib.finishRegistration request: %j, response: %j', registrationRequest, registrationResponse);

    u2fLib.finishRegistration(registrationRequest, registrationResponse)
      .then(function(result) {
        console.log('---u2fLib.finishRegistration response: %j', result);

        U2f.app.models.pair.create({
          publicKey: result.publicKey,
          keyHandle: result.keyHandle
        }, function(err) {
          if (err) {
            console.log(err);
            return callback(err);
          }
          return callback(null, result);
        });
      }, function(err) {
        console.log(err);
        return callback(err);
      });
  };

  U2f.remoteMethod(
    'registrationResponse',
    {
      description: 'Registration response',
      accepts: [
        {arg: 'challenge', type: 'string', description: 'challenge', required: true},
        {arg: 'clientData', type: 'string', description: 'client data', required: true},
        {arg: 'registrationData', type: 'string', description: 'registration data', required: true},
        {arg: 'keyHandle', type: 'string', description: 'keyHandle', required: true},
        {arg: 'version', type: 'string', description: 'version', required: true}
      ],
      returns: {type: 'object', root: true},
      http: [
        {verb: 'post', path: '/register'}
      ]
    }
  );
}

function signRequest(U2f) {
  U2f.signRequest = function(appId, keyHandle, callback) {

    u2fLib.startAuthentication(appId, [{
      keyHandle: keyHandle
    }])
    .then(function(request) {

      console.log('---u2fLib.startAuthentication response: %j', request);
      return callback(null, request);
      //TODO: hook after remote to attach data to this session
    }, function(err) {
      console.log(err);
      return callback(err);
    });
  };

  U2f.remoteMethod(
    'signRequest',
    {
      description: 'Sign-in request',
      accepts: [
        {arg: 'appId', type: 'string', description: 'App ID', required: true},
        {arg: 'keyHandle', type: 'string', description: 'keyHandle', required: true},
      ],
      returns: {type: 'object', root: true},
      http: [
        {verb: 'get', path: '/sign'}
      ]
    }
  );
}

function signResponse(U2f) {
  U2f.signResponse = function(challenge, clientData, keyHandle, signatureData, callback) {

    var signResponse = {
      clientData: clientData,
      keyHandle: keyHandle,
      signatureData: signatureData
    };

    U2f.app.models.pair.find({
      where: {
        keyHandle: keyHandle
      }
    }, function(err, registeredKeys) {

      //TODO: get challenge from session
      var _challenge = {
        appId: U2f.app.get('appID'),
        challenge: challenge,
        keyHandle: keyHandle,
        version: U2f.app.get('u2fVersion')
      };

      u2fLib.finishAuthentication(_challenge, signResponse, registeredKeys)
        .then(function(result) {

          console.log('---u2fLib.finishAuthentication response: %j', result);
          return callback(null, result);
        }, function(err) {
          console.log(err);
          return callback(err);
        });
      }
    );
  };

  U2f.remoteMethod(
    'signResponse',
    {
      description: 'Sign-in response',
      accepts: [
        {arg: 'challenge', type: 'string', description: 'challenge', required: true},
        {arg: 'clientData', type: 'string', description: 'client data', required: true},
        {arg: 'keyHandle', type: 'string', description: 'keyHandle', required: true},
        {arg: 'signatureData', type: 'string', description: 'signature data', required: true}
      ],
      returns: {type: 'object', root: true},
      http: [
        {verb: 'post', path: '/sign'}
      ]
    }
  );
}
