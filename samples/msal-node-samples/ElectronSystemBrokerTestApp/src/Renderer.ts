// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License

/**
 * The renderer API is exposed by the preload script found in the preload.ts
 * file in order to give the renderer access to the Node API in a secure and
 * controlled way
 */

import "bootstrap";
import "./index.scss";

declare const window: any;

window.api.startUiManager();
// UI event handlers
document.querySelector("#SignIn").addEventListener("click", () => {
    window.api.sendLoginMessage();
});

document.querySelector("#SignOut").addEventListener("click", () => {
    window.api.sendSignoutMessage();
});

document.querySelector("#seeProfile").addEventListener("click", () => {
    window.api.sendSeeProfileMessage();
});

document.querySelector("#readMail").addEventListener("click", () => {
    window.api.sendReadMailMessage();
});

