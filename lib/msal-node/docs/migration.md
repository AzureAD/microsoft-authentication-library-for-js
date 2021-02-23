# Migrate applications to the Microsoft Authentication Library (MSAL) for Node.js

Many developers have built and deployed applications using the Azure Active Directory Authentication Library (ADAL). We now recommend using the Microsoft Authentication Library (MSAL) for authentication and authorization of Azure AD entities.

By using MSAL instead of ADAL:

- You can authenticate a broader set of identities:
    - Azure AD identities
    - Microsoft accounts
    - Social and local accounts by using Azure AD B2C
- Your users will get the best single-sign-on experience.
- Your application can enable incremental consent.
- Supporting Conditional Access is easier.
- You benefit from innovation. Because all Microsoft development efforts are now focused on MSAL, no new features will be implemented in ADAL.

MSAL is now the recommended authentication library for use with the Microsoft identity platform.

## Frequently asked questions (FAQ)

**Q: Is ADAL being deprecated?**

A: Yes. Starting June 30th, 2020, we will no longer add new features to ADAL. We'll continue adding critical security fixes to ADAL until June 30th, 2022. After this date, your apps using ADAL will continue to work, but we recommend upgrading to MSAL to take advantage of the latest features and to stay secure.

**Q: Will my existing ADAL apps stop working?**

A: No. Your existing apps will continue working without modification. If you're planning to keep them beyond June 30th, 2022, you should consider updating your apps to MSAL to keep them secure, but migrating to MSAL isn't required to maintain existing functionality.

**Q: How do I know which of my apps are using ADAL?**

A: If you have the source code for the application, you can reference the migration guides below to help determine which library the app uses and how to migrate it to MSAL. If you partnered with an ISV, we suggest you reach out to them directly to understand their migration journey to MSAL.

**Q: Why should I invest in moving to MSAL?**

A: MSAL contains new features not in ADAL including incremental consent, single sign-on, and token cache management. Also, unlike ADAL, MSAL will continue to receive security patches beyond June 30th, 2022. Learn more.

**Q: Will Microsoft update its own apps to MSAL?**

Yes. Microsoft is in the process of migrating its applications to MSAL by the end-of-support deadline, ensuring they'll benefit from MSAL's ongoing security and feature improvements.

**Q: Will you release a tool that helps me move my apps from ADAL to MSAL?**

A: No. Differences between the libraries would require dedicating resources to development and maintenance of the tool that would otherwise be spent improving MSAL. However, we do provide the set of migration guides below to help you make the required changes in your application.

**Q: How does MSAL work with AD FS?**

A: MSAL for Node.js supports certain scenarios to authenticate against AD FS 2019. If your app needs to acquire tokens directly from earlier version of AD FS, you should remain on ADAL. Learn more.

**Q: How do I get help migrating my application?**

A: See the Migration guidance section of this article. If, after reading the guide for your app's platform, you have additional questions, you can post on Microsoft Q&A with the tag [azure-ad-adal-deprecation] or open an issue in library's GitHub repository. See the Languages and frameworks section of the MSAL overview article for links to each library's repo.

## Differences between MSAL and ADAL for node.js
For overall differences between ADAL.js and MSAL.you might want to read [Differences between MSAL.js and ADAL.js](https://docs.microsoft.com/en-us/azure/active-directory/develop/msal-compare-msal-js-and-adal-js)

### Difference in the Core API
- The method to acquire tokens using client credentials is has been renamed in MSAL to `acquireTokenByClientCredentials` from `acquireTokenWithClientCredentials`

- The methods to acquire tokens using the device code flow have been merged into `acquireTokenByDeviceCode` from the `acquireUserCode`, `acquireTokenWithDeviceCode` and `acquireToken` used to acquire a token via device code in MSAL.

- The method to acquire tokens using a refresh token has been renamed to `acquireTokenByRefreshToken` in MSAL from `acquireTokenWithRefreshToken` in ADAL

- The method to acquire tokens using a username and password pais has been renamed to `acquireTokenByUsernamePassword` in MSAL from `acquireTokenByUsernamePassword` in ADAL

- The use of a certificate as a credential to acquire a token has been moved from the `acquireTokenWithClientCertificate` and has been included in as one of the modes of authentication in the `ConfidentialApplication` user agent client application.

### Migrating from the AuthenticationContext to PublicClientApplication or ConfidentialClientApplication

#### Constructing PublicClientApplication or ConfidentialClientAppliation
When you use MSAL, you instantiate either a `PublicClientApplication` or a `ConfidentialClientApplication`. This object models your app identity and is used to make your requests through whichever flow you want. With this object you will configure your client idenitity, redirect URI, default authority, the log level and more.

You can declaratively configure this object with JSON.

#### Migrate from authority validation to known authorities
ADAL has a flag to enable or disable authority validation. Authority validation is a feature in ADAL, that prevents your code from requesting tokens from a potentially malicious authority, ADAL retrieves a list of authorities known to Microsoft and validates the user provided authority against the retrieved set of authorities. Use of the flag is shown in the code snippet below.

```js
// With this flag you can turn on and off the authority validation
// NOTE: The flag defaults to true
var validateAuthority = true;

var context = new AuthenticationContext(authorityUrl, validateAuthority);

context.acquireTokenWithClientCredentials(resource, clientId, clientSecret, function(err, tokenResponse) {
  if (err) {
    console.log('well that didn\'t work: ' + err.stack);
  } else {
    console.log(tokenResponse);
  }
});
```

MSAL does not have this validation flag, instead MSAL now retrieves a list of authorities known to Microsoft and merges that list with the authorities that you've specified in your configuration. It's against this combined list of authorities known to Microsoft and user known authorities, that the provided authority is validated against. Like illustrated in the code snippet below.

```js
// A user can include a list of know authorities to the config object to be used
// during authority validation, as shown below.
const msalConfig = {
    auth: {
        clientId: 'your_client_id',
        authority: 'https://login.live.com',
        knownAuthorities: ["login.live.com"],
        protocolMode: "OIDC"
    }
};

// Create msal application object
const cca = new msal.ConfidentialClientApplication(msalConfig)
```

#### Logging
You can now declaratively configure logging as part of your configuration, like this

```json
{
    auth: {...},
    system: {
        loggerOptions: {
            loggerCallback(loglevel, message, containsPii) {
                console.log(message);
            },
            piiLoggingEnabled: false,
            logLevel: msal.LogLevel.Verbose
        }
    }
}
```