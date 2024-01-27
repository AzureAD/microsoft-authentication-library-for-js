/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

const packageList = {
    "@azure/msal-common": process.env.MSAL_COMMON,
    "@azure/msal-browser": process.env.MSAL_BROWSER,    
    "@azure/msal-node": process.env.MSAL_NODE,
    "@azure/msal-angular": process.env.MSAL_ANGULAR,
    "@azure/msal-react": process.env.MSAL_REACT,
    "@azure/msal-node-extensions": process.env.MSAL_NODE_EXTENSIONS
};

const packagesToPublish = [];
Object.keys(packageList).forEach((packageName) => {
    if (packageList[packageName] === "true" || packageList[packageName] === true) {
        packagesToPublish.push(packageName);
    }
});

const packagesToPublishListString = packagesToPublish.reduce((commandString, packageName) => {
    return `${commandString} --package ${packageName}`;
}, "");

process.stdout.write(packagesToPublishListString || "");