What are the dev apps?
----------------------
index_loginPopup.html shows how to send an email with the Microsoft Graph, using msal.js loginPopup()/acquireTokenSilent-acquireTokenPopup() APIs. The authentication happens in a popup window of the browser.

indexRedirect.html shows how to send an email with the Microsoft Graph, using msal.js loginRedirect()/acquireTokenSilent-acquireTokenRedirect() APIs. The page for the application is replaced by the authentication page, and when authentication has happened, the application is called back (on its redirectUri) with the user's idToken.

How to run the dev apps:
--------------------
Pre-requisite
- Install node.js if needed (https://nodejs.org/en/)
- Build the `msal-core` project.

Resolving the server.js references
- In a command prompt, run `npm install`

Running the sample
- In a command prompt, run `npm start`

- Navigate to http://localhost:1530 with the browser of your choice

- In the web page, click on the “Login” button
