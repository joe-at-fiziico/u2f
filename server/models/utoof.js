var u2fLib= require("authdog");

module.exports = function(U2f) {

  registrationRequest(U2f);
  registrationResponse(U2f);
  signRequest(U2f);
  signResponse(U2f);
};

function registrationRequest(U2f) {
  U2f.registrationRequest = function(appId, callback) {

    u2fLib.startRegistration(appId, [])
      .then(function(request) {
        //{
        //  "appId": "http://localhost",
        //  "type": "u2f_register_request",
        //  "registerRequests": [
        //  {
        //    "version": "U2F_V2",
        //    "challenge": "_IBsOuGlciFnPuUoncwAqD78BrbLH28qsS9WbiDVzY0"
        //  }
        //],
        //  "registeredKeys": []
        //}
        console.log('u2fLib.startRegistration response: %j', request);
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
        {arg: 'appId', type: 'string', description: 'App ID', required: true}
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

    console.log('u2fLib.finishRegistration request: %j, response: %j', registrationRequest, registrationResponse);

    u2fLib.finishRegistration(registrationRequest, registrationResponse)
      .then(function(result) {
        console.log('u2fLib.finishRegistration response: %j', result);
        //{
        //  "publicKey": "BKRycKZfPA5FDzuiCkjoxIUOheLpfbDefLfPsjR8kuLx5vYKjyd8y652nd-yJwRbYOm3VTWrOetoGa2nYy_2ePA",
        //  "keyHandle": "VpmRcHRxkk9tz1A8d6z7FZhjZ2o4gdgkDUWnynFzT6drHBL6GNCYb9nFKQlPQytomhPSiytlJbQOFqOKQ2shEg",
        //  "certificate": "-----BEGIN CERTIFICATE-----\nMIICRDCCAS6gAwIBAgIEeMDfDjALBgkqhkiG9w0BAQswLjEsMCoGA1UEAxMjWXVi\naWNvIFUyRiBSb290IENBIFNlcmlhbCA0NTcyMDA2MzEwIBcNMTQwODAxMDAwMDAw\nWhgPMjA1MDA5MDQwMDAwMDBaMCoxKDAmBgNVBAMMH1l1YmljbyBVMkYgRUUgU2Vy\naWFsIDIwMjU5MDU5MzQwWTATBgcqhkjOPQIBBggqhkjOPQMBBwNCAAS1uHFcg/3+\nDqFcRXeshY30jBdv3oedyvS4PUDTIPJvreYl/Pf1yK/YNRj4254h7Ag7GEWAxxfs\nSkcLlopvuj9vozswOTAiBgkrBgEEAYLECgIEFTEuMy42LjEuNC4xLjQxNDgyLjEu\nMTATBgsrBgEEAYLlHAIBAQQEAwIFIDALBgkqhkiG9w0BAQsDggEBAD72q/ZKkWsL\n+ZSTjdyVNOBUQAJoVninLEOnq+ZdkGX/YfRRzoo67thmidGQuVCvAHpU0THu8G/i\na06nuz4yt5IFpd+nYAQ0U+NK+ETDfNSoX4xcLYcOCiiyt+1EAkH9s3krIHaw4Yr6\nm0Mu7vwmWLoJBcQbJKk8bsi7ptVvM+jWU9fPa9UBVFWiZZdA99zFHMAxYJzQPqbN\n6Tmeygh2MpB2P7TI0A9WkGmhJUkAauuwaiGiFOSZmDe0KegdflbTOlSS3ToWHIKT\nlUCBqn7vdJw6Vj2919ujlcxHPkRpbUGRhcJDesg6wGTBy+RyJ/96G3fH1eoMNn1F\n9jC9mY1Zsm4=\n-----END CERTIFICATE-----"
        //}

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

      console.log('u2fLib.startAuthentication response: %j', request);
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

    //var signResponse = {
    //  clientData:"eyJ0eXAiOiJuYXZpZ2F0b3IuaWQuZ2V0QXNzZXJ0aW9uIiwiY2hhbGxlbmdlIjoiOXdKZS10dzNnS3B5Z1QycXFjZkR2T0FReEE0UzMwbVNzd1ZTX2JFaG8tNCIsIm9yaWdpbiI6Imh0dHBzOi8vZGVtby55dWJpY28uY29tIiwiY2lkX3B1YmtleSI6InVudXNlZCJ9",
    //  keyHandle:"VpmRcHRxkk9tz1A8d6z7FZhjZ2o4gdgkDUWnynFzT6drHBL6GNCYb9nFKQlPQytomhPSiytlJbQOFqOKQ2shEg",
    //  signatureData:"AQAAAAQwRQIhAM308_W_xFZS6Vc3Cp4TLbdXeT3P9W9bHvcth-iF-RoXAiAiuAaFyeUAVM6EfSYBuVKmqvBxPN4JZ0aoui8q7uqjKw"
    //};

    console.log(challenge);

    var signResponse = {
      clientData: clientData,
      keyHandle: keyHandle,
      signatureData: signatureData
    };

    console.log(signResponse);

    U2f.app.models.pair.find({
      where: {
        keyHandle: keyHandle
      }
    }, function(err, registeredKeys) {

      console.log('find registeredKeys');
      console.log(registeredKeys);
      //TODO: get challenge from session
      var _challenge = {
        appId: U2f.app.get('appID'),
        challenge: challenge,
        keyHandle: keyHandle,
        version: U2f.app.get('u2fVersion')
      };

      u2fLib.finishAuthentication(_challenge, signResponse, registeredKeys)
        .then(function(result) {

          console.log('u2fLib.finishAuthentication response: %j', result);
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
