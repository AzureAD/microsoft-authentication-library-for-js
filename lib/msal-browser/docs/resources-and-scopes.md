# Resources and Scopes

> :warning: Before you start here, make sure you understand how to [acquire and use an access token](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/docs/acquire-token.md).

Azure Active Directory v2.0 & Microsoft Identity Platform employs a *scope-centric* to access resources. Here, a *resource* refers to any application that can be of recipient of an **Access Token** (such as [MS Graph API](https://docs.microsoft.com/graph/overview) or your own web API), and a *scope* (*aka* "permission") refers to any aspect of a resource that an **Access Token** grants rights.

**Access Token** requests in **MSAL.js** are meant to be *per-resource-per-scope(s)*. This means that an **Access Token** requested for resource **A** with scope `scp1`:

- cannot be used for accessing resource **A** with scope `scp2`, and,
- cannot be used for accessing resource **B** of any scope.
  
The intended recipient of an **Access Token** is represented by the `aud` claim; in case the value for the `aud` claim does not mach the resource **APP ID URI**, the token should be considered invalid. Likewise, the permissions that an **Access Token** grants is represented by the `scp` claim. [See the documentation for further information](https://docs.microsoft.com/azure/active-directory/develop/access-tokens#payload-claims).

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

> Bear in mind that you *can* request multiple scopes for the same resource (e.g. `User.Read`, `User.Write` and `Calendar.Read` for **MS Graph API**).

In case you *erroneously* pass multiple resources in your token request, the token you will receive will only be issued for the first resource.

     ```javascript
     // you will only receive a token for MS GRAPH API's "User.Read" scope here
     const myToken = await msalInstance.acquireTokenSilent({
          scopes: [ "User.Read", "api://<myCustomApiClientId>/My.Scope" ]
     });
     ```

## Dynamic Scopes and Incremental Consent

In Azure AD, The scopes (*permissions*) set directly on the application registration are called **static**. Other scopes that are only defined within the code are called **dynamic**. This has implications on MSAL.js' **login** (i.e. *loginPopup*, *loginRedirect*) and **acquireToken** (i.e. *acquireTokenPopup*, *acquireTokenRedirect*, *acquireTokenSilent*) methods. Consider:

     ```javascript
          const loginRequest = {
               scopes: [ "openid", "profile", "User.Read" ]
          };

          const tokenRequest = {
               scopes: [ "Mail.Read" ]
          };

          // will return an ID Token and an Access Token with scopes: openid, profile, User.Read
          msalInstance.loginPopup(loginRequest);

          // will fail and fallback to an interactive method prompting a consent screen
          msalInstance.acquireTokenSilent(tokenRequest);
     ```

In the code snippet above, the user will prompted for consent once they authenticate and receive an **ID Token** and an **Access Token** with scope `User.Read`. Later, if they request an **Access Token** for `User.Read`, they will not be asked for consent again (in other words, they can acquire a token *silently*). On the other hand, the user did not consented to `Mail.Read` at the authentication stage. As such, they will be asked for consent when requesting an **Access Token** for that scope.

Consider a slightly different case:

     ```javascript
          const loginRequest = {
               scopes: [ "openid", "profile", "User.Read", "api://<myCustomApiClientId>/My.Scope" ]
          };

          const tokenRequest = {
               scopes: [ "Mail.Read" ]
          };

          const anotherTokenRequest = {
               scopes: [ "api://<myCustomApiClientId>/My.Scope" ]
          }

          // will return an ID Token and an Access Token with scopes: openid, profile, User.Read
          msalInstance.loginPopup(loginRequest);

          // will fail and fallback to an interactive method prompting a consent screen
          msalInstance.acquireTokenSilent(tokenRequest);

          // will succeed and return an Access Token with scopes openid, profile, User.Read and api://<myCustomApiClientId>/My.Scope
          msalInstance.acquireTokenSilent(anotherTokenRequest);
     ```

In the code snippet above, even though the user consents to both `User.Read` and `api://<myCustomApiClientId>/My.Scope` scopes, they will only receive an **Access Token** for **MS Graph API**, in accordance with *per-resource-per-scope(s)* principle. However, since they already consented to `api://<myCustomApiClientId>/My.Scope`, they can acquire an **Access Token** for that resource/scope *silently* later on.
