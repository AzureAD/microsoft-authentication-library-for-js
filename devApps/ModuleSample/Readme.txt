What are the dev apps?
----------------------
index_loginPopup.html shows how to send an email with the Microsoft Graph, using msal.js loginPopup()/acquireTokenSilent-acquireTokenPopup() APIs. The authentication happens in a popup window of the browser. 

How to run the dev apps:
--------------------
Pre-requisite
- Install node.js if needed (https://nodejs.org/en/)

Resolving the server.js references
- In a command prompt, run npm install

Running the sample
- Update ./src/components/index.tsx to change code if necessary
- In a command prompt, run webpack
- In a command prompt, run “node server.js”

- Navigate to http://localhost:1530 with the browser of your choice

- In the web page, click on the “Login” button