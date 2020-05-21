# Token Return Types

| Scenarios | ClientId | No Scopes | Access Token Scopes with No ClientId | Access Token Scopes with ClientId
| ------- | ------- | -------- | --------- | -------- |
| **loginRedirect/Popup** | id_token | id_token |id_token token | id_token token
| **acquireTokenInteractive** | id_token | Error | token | id_token token 
| **acquireTokenSilent** | id_token | Error | token | id_token token
| **loginRedirect/Popup with accounts not matching** | id_token | id_token | id_token token | id_token token
| **acquireTokenInteractive with accounts not matching** | id_token | Error | id_token token | id_token token
| **acquireTokenSilent with accounts not matching** | id_token | Error | id_token token | id_token token