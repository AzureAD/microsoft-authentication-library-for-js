"use strict";
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License
Object.defineProperty(exports, "__esModule", { value: true });
var electron_1 = require("electron");
var UIManager_1 = require("./UIManager");
var Constants_1 = require("./Constants");
var uiManager = new UIManager_1.UIManager();
// UI event handlers
document.querySelector('#SignIn').addEventListener('click', function () {
    electron_1.ipcRenderer.send(Constants_1.IPC_MESSAGES.LOGIN);
});
document.querySelector('#SignOut').addEventListener('click', function () {
    electron_1.ipcRenderer.send(Constants_1.IPC_MESSAGES.LOGOUT);
});
document.querySelector('#seeProfile').addEventListener('click', function () {
    electron_1.ipcRenderer.send(Constants_1.IPC_MESSAGES.GET_PROFILE);
});
document.querySelector('#readMail').addEventListener('click', function () {
    electron_1.ipcRenderer.send(Constants_1.IPC_MESSAGES.GET_MAIL);
});
// Main process message subscribers
electron_1.ipcRenderer.on(Constants_1.IPC_MESSAGES.SHOW_WELCOME_MESSAGE, function (event, account) {
    uiManager.showWelcomeMessage(account);
});
electron_1.ipcRenderer.on(Constants_1.IPC_MESSAGES.SET_PROFILE, function (event, graphResponse) {
    uiManager.updateUI(graphResponse, Constants_1.GRAPH_CONFIG.GRAPH_ME_ENDPT);
});
electron_1.ipcRenderer.on(Constants_1.IPC_MESSAGES.SET_MAIL, function (event, graphResponse) {
    uiManager.updateUI(graphResponse, Constants_1.GRAPH_CONFIG.GRAPH_MAIL_ENDPT);
});
//# sourceMappingURL=Renderer.js.map