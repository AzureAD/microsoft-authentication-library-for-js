#### 3. Login the user

Your app must login the user with either the `loginPopup` or the `loginRedirect` method to establish user context.

When the login methods are called and the authentication of the user is completed by the Azure AD service, an [id token](https://docs.microsoft.com/azure/active-directory/develop/id-tokens) is returned which is used to identify the user with some basic information.

When you login a user, you can pass in scopes that the user can pre-consent to on login. However, this is not required. Please note that consenting to scopes on login, does not return an access_token for these scopes, but gives you the opportunity to obtain a token silently with these scopes passed in, with no further interaction from the user.

It is best practice to only request scopes you need when you need them, a concept called dynamic consent. While this can create more interactive consent for users in your application, it also reduces drop-off from users that may be uneasy granting a large list of permissions for features they are not yet using.

AAD will only allow you to get consent for 3 resources at a time, although you can request many scopes within a resource.
When the user makes a login request, you can pass in multiple resources and their corresponding scopes because AAD issues an idToken pre consenting those scopes. However acquireToken calls are valid only for one resource / multiple scopes. If you need to access multiple resources, please make separate acquireToken calls per resource.

```JavaScript
var loginRequest = {
    scopes: ["user.read", "mail.send"] // optional Array<string>
};

msalInstance.loginPopup(loginRequest)
.then(response => {
    // handle response
})
.catch(err => {
    // handle error
});
```
