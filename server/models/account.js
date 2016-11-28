
module.exports = function(Account) {

  [ 'updateAttributes',
    'replaceOrCreate',
    'patchAttributes',
    'replaceById',
    'upsertWithWhere',
    'upsert',
    'exists',
    'create',
    'find',
    'findById',
    'findOne',
    'updateAll',
    'createChangeStream',
    'destroyById',
    'count'
  ].forEach(function(methodName) {
      var methodObject = Account.sharedClass.find(methodName, true);
      if (methodObject) {
        methodObject.shared = false;
      }
      methodObject = Account.sharedClass.find(methodName, false);
      if (methodObject) {
        methodObject.shared = false;
      }
    });

  register(Account);
  registerResponse(Account);
  signIn(Account);
  signInResponse(Account);
};

function register(Account) {
  Account.register = function(name, callback) {
    Account.find({
      where: {
        name: name
      }
    }, function(err, result) {
      if (err) {
        console.log(err);
        return callback(err);
      }

      if (result.length === 0) {
        err = 'Account not found';
        console.log(err);
        return callback(err);
      }

      Account.app.models.utoof.registrationRequest(Account.app.get('appID'), result[0].keyHandle, function (err, data) {
        return callback(null, data);
      });
    });
  };

  //TODO: ACL check
  Account.remoteMethod(
    'register',
    {
      description: 'User register',
      accepts: [
        {arg: 'name', type: 'string', description: 'User name', required: true}
      ],
      returns: {type: 'object', root: true},
      http: [
        {verb: 'post', path: '/register'}
      ]
    }
  );
}

function registerResponse(Account) {
  Account.registerResponse = function(name, challenge, clientData, registrationData, keyHandle, version, callback) {
    Account.app.models.utoof.registrationResponse(
      challenge, clientData, registrationData, version, keyHandle, function(err, data) {
        // create or update user and and their keyHandle
        Account.find({
          where: {
            name: name
          }
        }, function(err, result) {
          if (err) {
            console.log(err);
            return callback(err);
          }

          if (result.length === 0) {
            err = 'Account not found';
            console.log(err);
            return callback(err);
          }

          result[0].keyHandle = data.keyHandle;
          result[0].save(function(err) {
            if (err) {
              console.log(err);
              return callback(err);
            }
            return callback(null, data);
          });
        });
    });
  };

  //TODO: ACL check
  Account.remoteMethod(
    'registerResponse',
    {
      description: 'User register response',
      accepts: [
        {arg: 'name', type: 'string', description: 'name', required: true},
        {arg: 'challenge', type: 'string', description: 'challenge', required: true},
        {arg: 'clientData', type: 'string', description: 'client data', required: true},
        {arg: 'registrationData', type: 'string', description: 'registration data', required: true},
        {arg: 'keyHandle', type: 'string', description: 'keyHandle', required: true},
        {arg: 'version', type: 'string', description: 'version', required: true}
      ],
      returns: {type: 'object', root: true},
      http: [
        {verb: 'post', path: '/registerResponse'}
      ]
    }
  );
}

function signIn(Account) {

  Account.signIn = function(name, password, callback) {

    //TODO: verify name/password

    Account.find({
      where: {
        name: name
      }
    }, function(err, account) {
      if (err) {
        console.log(err);
        return callback(err);
      }

      if (account.length === 0) {
        err = 'Account not found';
        console.log(err);
        return callback(err);
      }

      Account.app.models.utoof.signRequest(Account.app.get('appID'), account[0].keyHandle, function(err, data) {
        console.log(data);
        return callback(null, data);
      });
    });
  };

  Account.remoteMethod(
    'signIn',
    {
      description: 'User sign-in',
      accepts: [
        {arg: 'name', type: 'string', description: 'User name', required: true},
        {arg: 'password', type: 'string', description: 'User password', required: true}
      ],
      returns: {type: 'object', root: true},
      http: [
        {verb: 'post', path: '/sign'}
      ]
    }
  );
}

function signInResponse(Account) {

  Account.signInResponse = function(challenge, clientData, keyHandle, signatureData, callback) {

    Account.app.models.utoof.signResponse(challenge, clientData, keyHandle, signatureData, function(err, data) {
      console.log(data);
      return callback(null, data);
    });
  };

  Account.remoteMethod(
    'signInResponse',
    {
      description: 'User sign-in response',
      accepts: [
        {arg: 'challenge', type: 'string', description: 'challenge', required: true},
        {arg: 'clientData', type: 'string', description: 'client data', required: true},
        {arg: 'keyHandle', type: 'string', description: 'keyHandle', required: true},
        {arg: 'signatureData', type: 'string', description: 'signature data', required: true}
      ],
      returns: {type: 'object', root: true},
      http: [
        {verb: 'post', path: '/signInResponse'}
      ]
    }
  );
}
