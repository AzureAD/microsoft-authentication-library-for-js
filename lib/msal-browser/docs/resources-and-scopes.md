# Resources and Scopes

> :warning: Before you start here, make sure you understand how to [acquire and use an access token](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/docs/acquire-token.md).

Azure Active Directory v2.0 & Microsoft Identity Platform employs a *scope-centric* model to access resources. Here, a *resource* refers to any application that can be a recipient of an **Access Token** (such as [MS Graph API](https://docs.microsoft.com/graph/overview) or your own web API), and a *scope* (*aka* "permission") refers to any aspect of a resource that an **Access Token** grants rights.

**Access Token** requests in **MSAL.js** are meant to be *per-resource-per-scope(s)*. This means that an **Access Token** requested for resource **A** with scope `scp1`:

- cannot be used for accessing resource **A** with scope `scp2`, and,
- cannot be used for accessing resource **B** of any scope.

The intended recipient of an **Access Token** is represented by the `aud` claim; in case the value for the `aud` claim does not match the resource [APP ID URI](https://docs.microsoft.com/azure/active-directory/develop/scenario-protected-web-api-app-registration), the token should be considered invalid. Likewise, the permissions that an **Access Token** grants is represented by the `scp` claim. See [Access Token claims](https://docs.microsoft.com/azure/active-directory/develop/access-tokens#payload-claims) for more information.

## Working with Multiple Resources

When you have to access multiple resources, initiate a separate token request for each:

 ```javascript
 // "User.Read" stands as shorthand for "graph.microsoft.com/User.Read"
 const graphToken = await msalInstance.acquireTokenSilent({
      scopes: [ "User.Read" ]
 });
 const customApiToken = await msalInstance.acquireTokenSilent({
      scopes: [ "api://<myCustomApiClientId>/My.Scope" ]
 });
 ```

Bear in mind that you *can* request multiple scopes for the same resource (e.g. `User.Read`, `User.Write` and `Calendar.Read` for **MS Graph API**).

 ```javascript
 const graphToken = await msalInstance.acquireTokenSilent({
      scopes: [ "User.Read", "User.Write", "Calendar.Read" ] // all MS Graph API scopes
 });
 ```

In case you *erroneously* pass multiple resources in your token request, the token you will receive will only be issued for the first resource.

 ```javascript
 // you will only receive a token for MS GRAPH API's "User.Read" scope here
 const myToken = await msalInstance.acquireTokenSilent({
      scopes: [ "User.Read", "api://<myCustomApiClientId>/My.Scope" ]
 });
 ```

## Dynamic Scopes and Incremental Consent

In **Azure AD**, the scopes (*permissions*) set directly on the application registration are called **static scopes**. Other scopes that are only defined within the code are called **dynamic scopes**. This has implications on the **login** (i.e. *loginPopup*, *loginRedirect*) and **acquireToken** (i.e. *acquireTokenPopup*, *acquireTokenRedirect*, *acquireTokenSilent*) methods of **MSAL.js**. Consider:

 ```javascript
  const loginRequest = {
       scopes: [ "openid", "profile", "User.Read" ]
  };
  const tokenRequest = {
       scopes: [ "Mail.Read" ]
  };
  // will return an ID Token and an Access Token with scopes: "openid", "profile" and "User.Read"
  msalInstance.loginPopup(loginRequest);
  // will fail and fallback to an interactive method prompting a consent screen
  // after consent, the received token will be issued for "openid", "profile" ,"User.Read" and "Mail.Read" combined
  msalInstance.acquireTokenSilent(tokenRequest);
 ```

In the code snippet above, the user will be prompted for consent once they authenticate and receive an **ID Token** and an **Access Token** with the scope `User.Read`. Later, if they request an **Access Token** for `User.Read`, they will not be asked for consent again (in other words, they can acquire a token *silently*).

On the other hand, the user did not consent to `Mail.Read` at the authentication stage, therefore, will be asked for consent when requesting an **Access Token** for `Mail.Read` scope. The token received will contain all the previously consented scopes (for that specific resource), hence the term *incremental consent*.

Consider a slightly different case:

 ```javascript
  const loginRequest = {
       scopes: [ "openid", "profile", "User.Read" ],
       extraScopesToConsent: [ "api://<myCustomApiClientId>/My.Scope"]
  };
  const tokenRequest = {
       scopes: [ "Mail.Read" ]
  };
  const anotherTokenRequest = {
       scopes: [ "api://<myCustomApiClientId>/My.Scope" ]
  }
  // will return an ID Token and an Access Token with scopes: "openid", "profile" and "User.Read"
  msalInstance.loginPopup(loginRequest);
  // will fail with InteractionRequiredError due to lack of consent for "Mail.Read" scope. You should fallback to an interactive method in this case.
  msalInstance.acquireTokenSilent(tokenRequest);
  // will succeed and return an Access Token with scope "api://<myCustomApiClientId>/My.Scope"
  msalInstance.acquireTokenSilent(anotherTokenRequest);
 ```

In the code snippet above, even though the user consents to both `User.Read` and `api://<myCustomApiClientId>/My.Scope` scopes, they will only receive an **Access Token** for **MS Graph API**, in accordance with *per-resource-per-scope(s)* principle. However, since they already consented to `api://<myCustomApiClientId>/My.Scope`, they can acquire an **Access Token** for that resource/scope *silently* later on.

> :information_source: **Consent Lifetime**
>
> In Azure AD, consent lives beyond the lifetime of the application. This means that, when you request an **Access Token** for a resource, all the scopes you have previously consented to for that resource will be returned, regardless of what scope was requested at the time. In other words, if you consent to `User.Read` and `Mail.Read` today and run a new instance of your application tomorrow requesting an **Access Token** for `User.Read` only, you will still receive a token issued for **both** `User.Read` and `Mail.Read`. For more information, refer to [Permissions and Consent](https://docs.microsoft.com/azure/active-directory/develop/v2-permissions-and-consent#using-permissions).
