/*
 * Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT license.
 * See LICENSE in the project root for license information.
 */

import { PublicClientApplication } from "@azure/msal-browser";

/* global document, Office, Word */

Office.onReady((info) => {
  if (info.host === Office.HostType.Word) {
    document.getElementById("sideload-msg").style.display = "none";
    document.getElementById("app-body").style.display = "flex";
  }
});

export async function run() {
  return Word.run(async (context) => {
    /**
     * Insert your Word code here
     */

    // insert a paragraph at the end of the document.
    const paragraph = context.document.body.insertParagraph("Hello World", Word.InsertLocation.end);

    // change the paragraph color to blue.
    paragraph.font.color = "blue";

    await context.sync();
  });
}

// Config object to be passed to Msal on creation
const msalConfig = {
  auth: {
      clientId: "a076930c-cfc9-4ebd-9607-7963bccbf666",
      authority: "https://login.microsoftonline.com/common",
      supportsNestedAppAuth: true
  }
};

const loginRequest = {
  scopes: ["User.Read"]
};

let pca = undefined;

PublicClientApplication.createPublicClientApplication(msalConfig).then((result) => {
  pca = result;
  ssoGetToken();
});

export async function ssoGetToken(){
  //clientId: "a076930c-cfc9-4ebd-9607-7963bccbf666", //My msdn dev tenant
  //scope: "User.Read",
  //redirectUri: "https://localhost:3000",
  const activeAccount = pca.getActiveAccount();

  const tokenRequest = {
    scopes: ["User.Read"],
    account: activeAccount
  };

  pca.acquireTokenSilent(tokenRequest).then(async (result) => {
    console.log(result);
    const requestString = "https://graph.microsoft.com/v1.0/me";
    const headersInit = {'Authorization': result.accessToken};
    const requestInit = { 'headers': headersInit}
    if(requestString !== undefined){
        const result = await fetch(requestString, requestInit);
        if(result.ok){
          const data = await result.text();
          console.log(data);
          document.getElementById("userInfo").innerText = data;
        }else{
          //Handle whatever errors could happen that have nothing to do with identity
          console.log(result);
        }
        
    }else{
        //throw this should never happen
        throw new Error("unexpected: no requestString");
    }
  }).catch((error) => {
    console.log(error);
  });
}


