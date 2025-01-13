// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License

/**
 * The renderer API is exposed by the preload script found in the preload.ts
 * file in order to give the renderer access to the Node API in a secure and
 * controlled way
 */
// @ts-ignore
const renderer = window.renderer;
// @ts-ignore
window.renderer.startUiManager();

// UI event handlers
document.querySelector("#SignIn").addEventListener("click", () => {
    renderer.sendLoginMessage();
});

document.querySelector("#SignOut").addEventListener("click", () => {
    renderer.sendSignoutMessage();
});

document.querySelector("#seeProfile").addEventListener("click", () => {
    renderer.sendSeeProfileMessage();
});

document.querySelector("#readMail").addEventListener("click", () => {
    renderer.sendReadMailMessage();
});
