/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

module.exports = function(scenarioConfig, clientApplication) {
    const requestConfig = scenarioConfig.request;

    // With client credentials flows permissions need to be granted in the portal by a tenant administrator. 
    // The scope is always in the format "<resource>/.default"
    const clientCredentialRequest = requestConfig.clientCredentialRequest;

    clientApplication.acquireTokenByClientCredential(clientCredentialRequest).then((response) => {
        console.log("Response: ", response);
    }).catch((error) => {
        console.log(JSON.stringify(error));
    });
}