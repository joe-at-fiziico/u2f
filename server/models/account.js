
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
  signIn(Account);
};

function register(Account) {
  Account.register = function(name, callback) {
    Account.app.models.utoof.registrationRequest(Account.app.get('appID'), function(err, data) {
      return callback(null, data);
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

function signIn(Account) {

  Account.signIn = function(name, password, callback) {

    //TODO: verify name/password

    Account.find({
      where: {
        name: name
      }
    }, function(err, account) {
      //var keyHandle = 'VpmRcHRxkk9tz1A8d6z7FZhjZ2o4gdgkDUWnynFzT6drHBL6GNCYb9nFKQlPQytomhPSiytlJbQOFqOKQ2shEg';
      if (err) {
        console.log(err);
      }

      console.log(account);

      Account.app.models.utoof.signRequest(Account.app.get('appID'), account[0].keyHandle, function(err, data) {
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
