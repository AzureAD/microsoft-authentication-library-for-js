# 0.1.3

### Bug fixes

* Added ability to import msal as es-5 or es-6 module.
* Added webpack to create a umd bundle with a global variable Msal exported to the window  object.
* Fixed bug related to browser refresh. 
* Set user object from cache if available before every acquireToken request.
* Enable logging by passing a logger in the constructor function.

# 0.1.2
### Bug fixes
* Fixed bug with renewal of id_token.
* Added support for multiple asynchronous acquireToken requests.
* Added "user_cancelled" event for popup window.

# 0.1.1
### Bug fixes
* Fix browser specific issues.

# 0.1.0
Preview Release 
