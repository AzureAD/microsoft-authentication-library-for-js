# Roadmap

**Deliverable**|**Status**|**Expected Delivery**|**Description**
:-----:|:-----:|:-----:|:-----:
Msal Node Public Preview|In Progress|October 2020|Our Msal Node library is currently in private preview.  Public preview should include full Public Client and Confidential Client support.  When released, we will be committing to supporting this library at a production level, resolving bugs in a timely manner. 
Msal React Private Preview|In Progress|November 2020|Release our Msal React wrapper preview, using Auth Code Flow in browser. 
SN + I Support In Msal Node |Not Started|December 2020|Explanation of the flow from our python library: https://github.com/AzureAD/microsoft-authentication-library-for-python/issues/60
Refresh Token Proof of Possession [Browser]|Not started|December 2020|Proof of Possession is a feature that enables cryptographically locking a token to a browser.  This feature has already been shipped for Access Tokens.
Tenant Profile Support |Not Started|December 2020|Support for tenant profiles in our cache and account management.
Msal Angular 2.0 [Support for Auth Code Flow]|In Progress|December 2020|Upgrading our Msal Angular library to use the Msal Browser lib we recently GA'd to support the Auth Code Flow in the browser.  Helps alleviate some issues caused by blocked 3p cookies. 
Msal Node Middleware Design|Not Started|December 2020|Work to understand the middleware asks and requirements and then come up with a plan moving forward. 
Broker In Browser |In Progress|TBD|Application model for application nested in iframes, to support silent token acquisition where 3p cookies are blocked. 
Msal React Public Preview|Not Started|TBD|Once we are ready to support our msal react library in production we will move to public preview. 
Msal Node GA|Not Started|January 2021|After public preview, we will work to resolve issues and stabilize the library to be able to announce General Availability. 
