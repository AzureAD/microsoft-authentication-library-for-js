What are the dev apps?
----------------------
index.html shows how to get profile data and read email with the Microsoft Graph, using msal.js loginRedirect()/loginPopup()/acquireTokenSilent-acquireTokenPopup() APIs. 

If loginRedirect() is used, the web page redirects to the Azure AD or Azure AD B2C login screen for authentication. Once authentication is completed, the page redirects back to the redirect uri given with the requested tokens.

If loginPopup() is used, the authentication occurs inside a popup window created by the browser. The main window will handle token retrieval once authentication has been completed in the popup.

How to run the dev apps:
--------------------
Pre-requisite
- Install node.js if needed (https://nodejs.org/en/)
- Build the `msal-core` project.

Resolving the server.js references
- In a command prompt, run `npm install`

Running the sample
- In a command prompt, run `npm start`

You may also run `npm run start:build` to build the `msal-core` project and start the server in one command.

- Navigate to http://localhost:30662 with the browser of your choice

- In the web page, click on the "Sign In" button and select either `Sign in using Popup` or `Sign in using Redirect`
