'use strict'
var KeyVault = require('azure-keyvault');
const process = require('process');
var Q = require('q');
var AuthenticationContext = require('adal-node').AuthenticationContext;
var clientId = process.env['keyVaultClientId'];
var clientSecret = process.env['keyVaultClientSecret'];
var vaultUri = process.env['keyVaultUri'];


// Authenticator - retrieves the access token
var authenticator = function (challenge, callback) {
    // Create a new authentication context.
    var context = new AuthenticationContext(challenge.authorization);
    // Use the context to acquire an authentication token.
    return context.acquireTokenWithClientCredentials(challenge.resource, clientId, clientSecret, function (err, tokenResponse) {
        if (err) throw err;
        // Calculate the value to be set in the request's Authorization header and resume the call.
        var authorizationValue = tokenResponse.tokenType + ' ' + tokenResponse.accessToken;
        return callback(null, authorizationValue);
    });

};

var credentials = new KeyVault.KeyVaultCredentials(authenticator);
var client = new KeyVault.KeyVaultClient(credentials);

var getSecret = function (secretName) {
    var deferred = Q.defer();
    client.getSecret(vaultUri + '/secrets/' + secretName, function (err, result) {
        if (err) throw err;
        deferred.resolve(result);
    });
    return deferred.promise;
}

module.exports = {
    getAllSecrets: function (secretIds) {
        var deferred = Q.defer();
        getSecret(secretIds.browserstackUser).then(function (result) {
            secretIds.browserstackUser = result.value;
            return getSecret(secretIds.browserstackKey)
        }).then(function (result) {
            secretIds.browserstackKey = result.value;
            return getSecret(secretIds.loginPassword);
        }).then(function (result) {
            secretIds.loginPassword = result.value;
            deferred.resolve(secretIds);
        })
        return deferred.promise;
    }
};


