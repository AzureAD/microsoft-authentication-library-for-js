const AuthenticationContext = require('adal-node').AuthenticationContext;
const MicrosoftGraph = require("@microsoft/microsoft-graph-client");

const authorityHostUrl = 'https://login.windows.net';
const tenantName = ''; //azure active directory tenant name. ie: name.onmicrosoft.com
const authorityUrl = authorityHostUrl + '/' + tenantName;
const applicationId = ''; //application id for registered app
const clientSecret = ''; //azure active directory registered app secret
const resource = "https://graph.microsoft.com"; //URI of resource where token is valid

const context = new AuthenticationContext(authorityUrl);

context.acquireTokenWithClientCredentials(
    resource,
    applicationId,
    clientSecret,
    function(err, tokenResponse) {
    if (err) {
      console.log('well that didn\'t work: ' + err.stack);
    } else {
      let client = MicrosoftGraph.Client.init({
        defaultVersion: 'v1.0',
        authProvider: (done) => {
            done(null, tokenResponse.accessToken);
        },
      });

      client
      .api('/users')
      .get((err, result) => {
          console.log(result, err);
      });
    }
});