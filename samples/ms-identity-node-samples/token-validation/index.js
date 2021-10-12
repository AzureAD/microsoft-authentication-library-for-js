/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

const express = require("express");
const msIdentity = require("@azure/ms-identity-node")

/**
 * Command line arguments can be used to configure:
 * - The port the application runs on
 */
const argv = require("../../msal-node-samples/cliArgs");

const SERVER_PORT = argv.p || 3000;

// Sample Application Code
const getTokenAuthCode = function (port) {
    // Set the port that the express server will listen on
    const serverPort = port || SERVER_PORT;
    // Create Express App and Routes
    const app = express();

    const config = {
        authority: "https://login.microsoftonline.com/common/"
    };

    app.get("/", (req, res) => {
        const tokenValidator = new msIdentity.TokenValidator(config);
        const rawToken = "eyJ0eXAiOiJKV1QiLCJub25jZSI6Imdzcy1sWHIyZ1BWMjRCd2Y1ZVR4cGhhSFFIYkFPRnpUR3E5VWlxMHEwRlUiLCJhbGciOiJSUzI1NiIsIng1dCI6InZhcF9pdmtIdHRMRmNubm9CWEF3SjVIWDBLNCIsImtpZCI6InZhcF9pdmtIdHRMRmNubm9CWEF3SjVIWDBLNCJ9.eyJhdWQiOiIwMDAwMDAwMy0wMDAwLTAwMDAtYzAwMC0wMDAwMDAwMDAwMDAiLCJpc3MiOiJodHRwczovL3N0cy53aW5kb3dzLXBwZS5uZXQvMTllZWEyZjgtZTE3YS00NzBmLTk1NGQtZDg5N2M0N2YzMTFjLyIsImlhdCI6MTYzNDA2OTQ5MiwibmJmIjoxNjM0MDY5NDkyLCJleHAiOjE2MzQwNzM1NzEsImFjY3QiOjAsImFjciI6IjEiLCJhaW8iOiJFMk5nWUtqYVpCZWkrYmFqNXZ5V1lQYURqMkpPM2p1YXQ2aldabjhsbzAvY2ZCUDF6UllBIiwiYW1yIjpbInB3ZCJdLCJhcHBfZGlzcGxheW5hbWUiOiJQSy1NU0FMVGVzdDIuMCIsImFwcGlkIjoiM2ZiYTU1NmUtNWQ0YS00OGUzLThlMWEtZmQ1N2MxMmNiODJlIiwiYXBwaWRhY3IiOiIwIiwiZmFtaWx5X25hbWUiOiJCYXNpYyBVc2VyIiwiZ2l2ZW5fbmFtZSI6IkNsb3VkIElETEFCIiwiaWR0eXAiOiJ1c2VyIiwiaXBhZGRyIjoiNzMuMTQwLjIwNC45MCIsIm5hbWUiOiJDbG91ZCBJRExBQiBCYXNpYyBVc2VyIiwib2lkIjoiYmUwNjRjMzctMjYxNy00NjhjLWI2MjctMjViNGU0ODE3YWRmIiwicGxhdGYiOiIxIiwicHVpZCI6IjEwMDM0MDAwMDA1NDc3QkEiLCJyaCI6IjAuQUFBQS1LTHVHWHJoRDBlVlRkaVh4SDh4SEc1VnVqOUtYZU5JamhyOVY4RXN1QzRCQU5rLiIsInNjcCI6IkZpbGVzLlJlYWQgTWFpbC5SZWFkIG9wZW5pZCBwcm9maWxlIFVzZXIuUmVhZCBlbWFpbCIsInNpZ25pbl9zdGF0ZSI6WyJrbXNpIl0sInN1YiI6InRMY2hZdW1HM0l2WU9Va0Jaa1NBM21oZzhFX2JzRmQ4blNpYnFJTl9FMVUiLCJ0ZW5hbnRfcmVnaW9uX3Njb3BlIjoiTkEiLCJ0aWQiOiIxOWVlYTJmOC1lMTdhLTQ3MGYtOTU0ZC1kODk3YzQ3ZjMxMWMiLCJ1bmlxdWVfbmFtZSI6IklETEFCQG1zaWRsYWIwLmNjc2N0cC5uZXQiLCJ1cG4iOiJJRExBQkBtc2lkbGFiMC5jY3NjdHAubmV0IiwidXRpIjoiU1RUYkw2YnlDMENRMjBhQl83VU9BQSIsInZlciI6IjEuMCIsIndpZHMiOlsiYjc5ZmJmNGQtM2VmOS00Njg5LTgxNDMtNzZiMTk0ZTg1NTA5Il0sInhtc19zdCI6eyJzdWIiOiJsdkJ0ZHZlZHQ0ZE9acnhmb0I3Y21fVE5FN0xxbnBuZXBhR3NxLVJmZEtjIn0sInhtc190Y2R0IjoxNTQ0NTc0MzYzfQ.bqzTNu8aco8AX5-EJ9v3PtOJ7Hd7DmX6-li6vN6VHFkmCYIJNcKUjd1gPCOitNWrO-NPqDRrTc4wcQoStJL927FWkxoVZqOqjrMFxMrRiFnGb5gw0ruRIUZr3aO8SDLpORx0jkSjmJuY_JkFu5hxWPQFNbzMJPUefqj1VAcfYtRZbBfBY0t5vHYWiVWFuAfeI3MLEM7DBKnxvjWxOtGp4rVlpwIkUYyCKvZxbl17O73fmr_ujp-rlts_jigBk8eRVZswTlITdavVeINZV7EMzINrwoDdbNPnIn4l8RUV_MOMYCdDmT9rduEusFbf27QYwGKxyKujA-zmrEEDL_VqLw";
        const tokenValidationParams = {
            rawTokenString: rawToken,
        };
        console.log(tokenValidator);
        tokenValidator.validateToken(tokenValidationParams).then((response) => {
            console.log("Token was validated");
            console.log(response);
            res.sendStatus(200);
        }).catch((error) => {
            console.log(error);
            res.status(500).send(error);
        });
    });

    return app.listen(serverPort, () => console.log(`Msal Node Auth Code Sample app listening on port ${serverPort}!`));
}

/**
 * The code below checks if the script is being executed manually or in automation.
 */
if(argv.$0 === "index.js") {
    // Execute sample application with the configured MSAL PublicClientApplication
    return getTokenAuthCode(null);
}

// The application code is exported so it can be executed in automation environments
module.exports = getTokenAuthCode;
