What is this sample?
--------------------
This is a simple JavaScript Simple page application
showcasing how to use MSAL.js to authenticate users
via Azure Active Directory B2C,
and access a Web API with the resulting tokens.


How to run this AzureAD B2C sample
----------------------------------
Pre-requisite
- Install node.js if needed (https://nodejs.org/en/)
- Build the `msal-core` project.

Resolving the server.js references
- In a command prompt, run npm install

Running the sample
- In a command prompt, run “node server.js”

- Navigate to http://localhost:6420 with the browser of your choice

- In the web page, click on the “Login” button
- Sign-up with a local account (at the bottom of the page click sign-up, and then answer the questions)
  alternatively sign-in with a gmail account
- Once signed-in, the "Logout" button appears
- Click on "Call Web Api" to call the Web APi application (which source code is in https://github.com/Azure-Samples/active-directory-b2c-javascript-nodejs-webapi)

 Signing-in with an MSA or a Twitter account does not work yet.
