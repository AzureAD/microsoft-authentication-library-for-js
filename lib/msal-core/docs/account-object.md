# Accounts in MSAL

The MSAL SDKs have supported the notion of authenticating multiple user accounts. To align with this model, MSAL.js 1.x uses `Account` object. The object will surface the information about the authenticated user account.

```javascript
// Account Class
export class Account {

    accountIdentifier: string;
    homeAccountIdentifier: string;
    userName: string;
    name: string;
    idToken: StringDict; // will be deprecated soon
    idTokenClaims: StringDict;
    sid: string;
    environment: string;
}
```

#### Example usage:

```javascript
//after user account is authenticated by calling login methods
const account = myMSALObj.getAccount();
console.log(account.userName);
console.log(account.accountIdentifier);    
```
