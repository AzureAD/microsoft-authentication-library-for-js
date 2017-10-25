Version 1.0.0
==========================
Added ability to import msal as es-5 or es-6 module.
Added webpack to create a umd bundle with a global variable Msal exported to the window object.
Fixed bug related to browser refresh. 
Set user object from cache if available before every acquireToken request.
Making constructor function synchronous.
Enable logging by passing a logger in the constructor function.
Breaking Change: To access the instance of msal in the callback passed to the constructor method, use the 'this' keyword instead of the instance variable. For example:
```
var userAgentApplication = new Msal.UserAgentApplication('your_client_id', 'authority', authCallback, { logger: logger });
function authCallback(errorDesc, token, error, tokenType, instance) {
console.log(userAgentApplication)//undefined
console.log(self)// instance of userAgentApplication;
}
```
Version 0.1.2
==========================
Fixed bug with renewal of id_token.
Added support for multiple asynchronous acquireToken requests.
Added "user_cancelled" event for popup window.

Version 0.1.1
==========================
Fix browser specific issues.

Version 0.1.0
==========================
Preview Release 